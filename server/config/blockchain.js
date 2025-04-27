const Web3 = require('web3');
const CarpoolingContract = require('../../client/src/contracts/CarpoolingContract.json');

const initWeb3 = () => {
  const web3 = new Web3('http://localhost:8545');
  return web3;
};

const getContract = async () => {
  const web3 = initWeb3();
  const networkId = await web3.eth.net.getId();
  console.log('Network ID:', networkId);
  console.log('Deployed networks:', CarpoolingContract.networks);
  const deployedNetwork = CarpoolingContract.networks[networkId];
  
  const contract = new web3.eth.Contract(
    CarpoolingContract.abi,
    deployedNetwork && deployedNetwork.address
  );
  
  return contract;
};

module.exports = { initWeb3, getContract };