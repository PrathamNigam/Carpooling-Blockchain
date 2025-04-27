const CarpoolingContract = artifacts.require("CarpoolingContract");

module.exports = function(deployer) {
  deployer.deploy(CarpoolingContract);
};