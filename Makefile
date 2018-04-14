build_image:
	docker build -t docker.nextagilesoft.com/blockchain/quorum_eth_node_one -f ./Dockerfile .

run: build_image
	docker run --rm -it -p 26000:26000 -p 25000:22000 --name quorum_eth_node_one docker.nextagilesoft.com/blockchain/quorum_eth_node_one bash

push: build_image
	docker push docker.nextagilesoft.com/blockchain/quorum_eth_node_one

objects = FactoryAuction
all: $(objects)

compile_contracts:
	rm -rf ./dist
	solc ./contracts/FactoryAuction.sol  -o ./dist --bin --abi

deploy_contracts: compile_contracts
	yarn deploy:contracts

build_local: push
	yarn deploy:k8s -r gt-staging-blockchain -o ./build_chart

deploy_local: build_local
	helm ls | grep gt-staging-blockchain  > /dev/null && helm upgrade gt-staging-blockchain -f build_chart/values.yaml ./build_chart || helm install --name gt-staging-blockchain -f build_chart/values.yaml ./build_chart

push_git:
	git add . && git commit -m "update" && git push

# publich_local:
