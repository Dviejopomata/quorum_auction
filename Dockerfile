FROM ubuntu:16.04

LABEL version="1.0"
LABEL maintainer="davidviejopomata@gmail.com"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install --yes software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum
RUN apt-get update
RUN apt-get install -y wget build-essential unzip libdb-dev libleveldb-dev libsodium-dev zlib1g-dev libtinfo-dev solc sysvbanner wrk

ENV CVER="0.3.2"
ENV CREL="constellation-$CVER-ubuntu1604"
RUN wget -q https://github.com/jpmorganchase/constellation/releases/download/v$CVER/$CREL.tar.xz
RUN tar xfJ $CREL.tar.xz
RUN cp $CREL/constellation-node /usr/local/bin && chmod 0755 /usr/local/bin/constellation-node
RUN rm -rf $CREL

ENV GOREL=go1.9.3.linux-amd64.tar.gz
RUN wget -q https://dl.google.com/go/$GOREL
RUN tar xfz $GOREL
RUN mv go /usr/local/go
RUN rm -f $GOREL
ENV PATH="/usr/local/go/bin:${PATH}"
RUN apt-get install -y git
RUN git clone https://github.com/jpmorganchase/quorum.git


RUN cd quorum && git checkout tags/v2.0.1 && make all && cp build/bin/geth /usr/local/bin && cp build/bin/bootnode /usr/local/bin

RUN wget -q https://github.com/jpmorganchase/quorum/releases/download/v1.2.0/porosity && mv porosity /usr/local/bin && chmod 0755 /usr/local/bin/porosity
ENV DATADIR=data/
COPY ${DATADIR}/permissioned-nodes.json /qdata/dd1/static-nodes.json
COPY ${DATADIR}/permissioned-nodes.json /qdata/dd1
COPY ${DATADIR}/keys/key1 /qdata/dd1/keystore/key1
COPY ${DATADIR}/raft/nodekey1 /qdata/dd1/geth/nodekey
COPY ${DATADIR}/genesis.json .
COPY ${DATADIR}/passwords.txt .
COPY ${DATADIR}/keys/tm1.pub /qdata/c1/tm.pub
COPY ${DATADIR}/keys/tm1.key /qdata/c1/tm.key
RUN mkdir -p qdata/logs
COPY ${DATADIR}/docker-entrypoint.sh .

ENTRYPOINT ["/bin/bash", "docker-entrypoint.sh"]
