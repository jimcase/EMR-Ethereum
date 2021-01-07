//var Utils = artifacts.require("./Utils.sol");
var MedicalRecord = artifacts.require("MedicalRecord.sol");

module.exports = async function (deployer) {
    //await deployer.deploy(Utils);
    //await deployer.link(Utils, MedicalRecord)
    await deployer.deploy(MedicalRecord);
};

