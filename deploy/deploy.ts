#!/usr/bin/env node
import {
  BuildAndPushImages,
  Chart,
  Dependency,
  DockerImage,
  DockerRegistry,
} from "helm-docker-builder"
import path = require("path")
import yargs = require("yargs")
import { email, pullSecret, pwd, registryUrl, user } from "./config"

const k8s = require("kubernetes-client")
const CHARTS_DIR = path.join(__dirname, "charts")

const argv = yargs
  .version("1.0.0")
  .alias("version", "v")
  .options({
    namespace: {
      alias: "n",
      description: "Default namespace ",
      default: "default",
    },
    output: {
      alias: "o",
      description: "Output directory of the chart",
      default: "build",
    },
    debug: {
      alias: "de",
      description: "Debug",
      boolean: true,
      default: false,
    },
    release: {
      alias: "r",
      description: "Name of the release",
      required: true,
    },
    k8surl: {
      alias: "k",
      description: "Name of the release",
      default: "http://localhost:8001",
    },
    domain: {
      alias: "d",
      description: "Domain of the deployment",
      default: process.env.DOMAIN || "nextagilesoft.com",
    },
    subdomain: {
      alias: "s",
      description: "Subdomain of the deployment",
      default: process.env.CI_ENVIRONMENT_SLUG || "master",
    },
  }).argv

async function BuildK8sSecret({ k8surl, dockerAuth, namespace }) {
  const core = new k8s.Core({
    url: k8surl,
    version: "v1", // Defaults to 'v1'
  })
  const pullSecretRegistry = {
    apiVersion: "v1",
    data: {
      ".dockerconfigjson": Buffer.from(JSON.stringify(dockerAuth)).toString(
        "base64",
      ),
    },
    kind: "Secret",
    metadata: {
      name: pullSecret,
    },
    type: "kubernetes.io/dockerconfigjson",
  }
  try {
    await core
      .ns(namespace)
      .secrets(pullSecret)
      .get()
    console.log("K8s secret found")
  } catch (error) {
    await core.ns(namespace).secrets.post({ body: pullSecretRegistry })
  }
}

async function main() {
  const { domain, subdomain, k8surl, namespace, release, output } = argv
  const baseChart = path.join(CHARTS_DIR, "base")
  const emptyChart = path.join(CHARTS_DIR, "empty")

  const dockerAuth = {
    auths: {
      [registryUrl]: {
        username: user,
        password: pwd,
        email,
        auth: Buffer.from(`${user}:${pwd}`).toString("base64"),
      },
    },
  }
  await BuildK8sSecret({ dockerAuth, k8surl, namespace })
  const registry = new DockerRegistry(registryUrl, user, pwd)
  const rootPath = path.join(__dirname, "..")
  const serverImage = new DockerImage(
    registry,
    `${registry.registry}/blockchain/quorum_eth_node_one`,
    rootPath,
    "Dockerfile",
  )

  const apiImage = new DockerImage(
    registry,
    `${registry.registry}/blockchain/api_server`,
    rootPath,
    "Dockerfile.api",
  )
  const images = [serverImage, apiImage]
  await BuildAndPushImages(images)

  const globalEnv = []
  const apiHost = `${subdomain}.${domain}`
  const apiChart = new Chart(
    "api",
    baseChart,
    {
      pullSecrets: [pullSecret],
      replicaCount: 1,
      ports: {
        http: 3000,
      },

      liveness: "/ping",
      fullnameOverride: "master",
      env: [...globalEnv, { name: "NODE_ENV", value: "production" }],
      image: {
        repository: apiImage.repository,
        tag: apiImage.getVersion(),
        pullPolicy: "Always",
      },
      service: {
        type: "ClusterIP",
        port: 80,
      },
      ingress: {
        enabled: true,
        annotations: {},
        hosts: [apiHost],
        tls: [
          {
            hosts: [apiHost],
          },
        ],
      },
      resources: {},
      nodeSelector: {},
      tolerations: [],
      affinity: {},
    },
    {
      apiVersion: "v1",
      appVersion: "1.0",
      description: "Api",
      name: "api",
      version: "0.1.0",
    },
  )

  const proxyHost = `blockchain-${subdomain}.${domain}`
  const serverChart = new Chart(
    "blockchain-node1",
    baseChart,
    {
      pullSecrets: [pullSecret],
      replicaCount: 1,
      ports: {
        http: 22000,
      },

      liveness: "/ping",
      fullnameOverride: "blockchain-node1",
      env: [...globalEnv],
      image: {
        repository: serverImage.repository,
        tag: serverImage.getVersion(),
        pullPolicy: "Always",
      },
      service: {
        type: "ClusterIP",
        port: 80,
      },
      ingress: {
        enabled: true,
        annotations: {},
        hosts: [proxyHost],
        tls: [
          {
            hosts: [proxyHost],
          },
        ],
      },
      resources: {},
      nodeSelector: {},
      tolerations: [],
      affinity: {},
    },
    {
      apiVersion: "v1",
      appVersion: "1.0",
      description: "blockchain-node1",
      name: "blockchain-node1",
      version: "0.1.0",
    },
  )

  const rootChart = new Chart(
    "root",
    emptyChart,
    {},
    {
      apiVersion: "v1",
      appVersion: "1.0",
      description: "Root chart",
      name: "root",
      version: "0.1.0",
    },
  )
  rootChart.addChart(serverChart)
  rootChart.addChart(apiChart)
  const outputDir = path.resolve(output)
  await rootChart.dumpAll(outputDir, { buildDependencies: true })
  console.log("Finished")
}

main()
