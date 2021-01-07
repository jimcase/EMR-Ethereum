var Doctor = artifacts.require("./model/Doctor.sol");
var Patient = artifacts.require("./model/Patient.sol");

module.exports = async function (deployer) {
  //
  await deployer.deploy(Doctor, "", "https://doctor.good.com", "kbchb6r2gfiqbi");
  await deployer.deploy(Patient, "");
};
