constellation-node --url=https://127.0.0.1:9001/ --port=9001 --workdir=qdata/c1 --socket=tm.ipc --publickeys=tm.pub --privatekeys=tm.key --othernodes=https://127.0.0.1:9001/ >> qdata/logs/constellation1.log 2>&1 &
geth --datadir qdata/dd1 init genesis.json
sleep 3
export PRIVATE_CONFIG=qdata/c1/tm.ipc
geth --ws --wsport 26000 --wsaddr 0.0.0.0 --wsorigins "*" --wsapi "eth,web3"  --datadir qdata/dd1 --raft --rpc --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum --emitcheckpoints --permissioned --raftport 50401 --rpcport 22000 --port 21000 --unlock 0 --password passwords.txt