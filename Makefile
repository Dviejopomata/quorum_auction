build_image:
	docker build -t docker.nextagilesoft.com/blockchain/quorum_eth_node_one -f ./Dockerfile .

run: build_image
	docker run --rm -it -p 25000:22000 --name quorum_eth_node_one docker.nextagilesoft.com/blockchain/quorum_eth_node_one bash

push: build_image
	docker push docker.nextagilesoft.com/blockchain/quorum_eth_node_one

compile_contracts:
	truffle compile

deploy_contracts: compile_contracts
	yarn deploy:contracts

deploy_k8s: push
	yarn deploy:k8s -r gt-staging-blockchain -o ./build_chart