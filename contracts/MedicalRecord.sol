pragma solidity ^0.8.0;

/// @author Jaime Caso
/// @title A Electronic Medical Record System
contract MedicalRecord {

    address private owner;

    struct Record {
        address doctor;
        address patient;
        string hash;
        string encoding;
        bool verified;
    }

    // Roles
    mapping(address => Doctor) public doctorProfile;
    mapping(address => Patient) public patientProfile;
    // Records
    mapping(string => Record) public recordData;

    // Events
    event createDoctorLog(address _doctor);
    event requestDoctorLog(address _doctor, address _patient);
    event patientAddedByDoctorLog(address _doctor, address _patient);
    event verifiedRecordLog(address _patient, string _hash);



    // Set the owner ot this contract just once
    // Consider use Initializer to make the contract upgradable
    constructor() {
        owner = msg.sender;
    }

    /** Register as Patient. */
    function registerAsPatient(string memory _name) public returns (bool) {

        Patient p = new Patient(_name);

        patientProfile[msg.sender] = p;

        return true;
    }

    /** Add a new Doctor. */
    function addDoctor(address _doctor, string memory _name, string memory _url, string memory _metadataHash) public isOwner() returns (bool) {

        doctorProfile[_doctor] = new Doctor(_name, _url, _metadataHash);
        // Event
        emit createDoctorLog(_doctor);

        return true;
    }

    /** Request a doctor. */
    function requestDoctor(address _doctor) public returns (bool) {

        require(doctorProfile[_doctor].getOpen(), "The doctor is closed to new patients");

        patientProfile[msg.sender].requestDoctor(_doctor);

        // Event
        emit requestDoctorLog(_doctor, msg.sender);

        return true;
    }

    function doctorInPatient(address _doctor, address _patient) view public returns (bool){

        require(patientProfile[_patient].isActive(), "The patient must be activated");

        return patientProfile[_patient].containsDoctor(_doctor);
    }

    /** Add a new Patient to the doctor mapping. */
    function addNewPatient(address _patient) public isDoctor() doctorIsAllowed(_patient) returns (bool) {

        doctorProfile[msg.sender].addPatient(_patient);
        // Event
        emit patientAddedByDoctorLog(msg.sender, _patient);

        return true;
    }

    function patientInDoctor(address _patient, address _doctor) view public returns (bool){

        require(doctorProfile[_doctor].isActive(), "The doctor must be activated");

        return doctorProfile[_doctor].isPatient(_patient);
    }

    /** Add as a new record. */
    function addRecord(address _patient, string memory _hash, string memory _encoding) public isDoctor() doctorIsAllowed(_patient) returns (bool) {

        Record memory r = Record(msg.sender, _patient, _hash, _encoding, false);
        recordData[_hash] = r;
        // Event

        return true;
    }

    /** verify a record. */
    function verifyRecord(string memory _hash) public returns (bool) {

        require(recordData[_hash].patient == msg.sender, "Just the patient can verify the record");
        recordData[_hash].verified = true;

        // Event
        emit verifiedRecordLog(msg.sender, _hash);

        return true;
    }

    /** get a specific record. */
    function getRecord(string memory _hash) view public returns (address, address, string memory, bool) {

        require(recordData[_hash].doctor != address(0), "The record does not exist");

        return (recordData[_hash].doctor,
        recordData[_hash].patient,
        recordData[_hash].encoding,
        recordData[_hash].verified);
    }

    function getPatient(address _patient) view public returns (string memory, bool) {

        require(patientProfile[_patient].active(), "The patient does not exist or is deactivated");

        return patientProfile[_patient].getAttrs();
    }

    function getDoctor(address _doctor) view public returns (string memory, string memory, string memory, bool, bool) {

        require(doctorProfile[_doctor].active(), "The doctor does not exist or is deactivated");

        return doctorProfile[_doctor].getAttrs();
    }

    function switchActiveDoctor() isDoctor() public {

        bool open = !doctorProfile[msg.sender].getOpen();

        doctorProfile[msg.sender].setOpen(open);
    }

    function addrIsPatient(address _patient) view public returns (bool) {

        return patientProfile[_patient].isActive();
    }

    function addrIsDoctor(address _doctor) view public returns (bool) {

        return doctorProfile[_doctor].isActive();
    }

    /** Valid username requirement. */
    modifier isOwner() {
        require(owner == msg.sender, "The caller is not the admin");
        _;
    }

    /** Valid username requirement. */
    modifier isDoctor() {
        require(addrIsDoctor(msg.sender), "The doctor is no activated");
        _;
    }

    /** Valid username requirement. */
    modifier doctorIsAllowed(address _patient) {
        require(patientProfile[_patient].containsDoctor(msg.sender), "The doctor is not allowed");
        _;
    }
}

contract Patient {

    string public name;
    bool public active;
    mapping(address => bool) public doctorAccess;

    constructor(string memory _name) {
        name = _name;
        active = true;
    }

    function requestDoctor(address _doctor) public {
        doctorAccess[_doctor] = true;
    }

    function revokeDoctor(address _doctor) public {
        doctorAccess[_doctor] = false;
    }

    function containsDoctor(address _doctor) view public returns (bool){
        return doctorAccess[_doctor];
    }

    function isActive() view public returns (bool){
        return active;
    }

    function getAttrs() view public returns (string memory, bool){
        return (name, active);
    }

}

contract Doctor {

    string public name;
    string public url;
    string public metadataHash;
    bool public open;
    bool public active;
    mapping(address => bool) public patients;

    constructor(string memory _name, string memory _url, string memory _metadataHash) {
        name = _name;
        url = _url;
        metadataHash = _metadataHash;
        open = false;
        active = true;
    }

    function getOpen() public view returns (bool){
        return open;
    }

    function setOpen(bool _open) public {
        open = _open;
    }

    function isActive() view public returns (bool){
        return active;
    }

    function addPatient(address _patient) public {
        patients[_patient] = true;
    }

    function isPatient(address _patient) view public returns (bool){
        return patients[_patient];
    }

    function deletePatient(address _patient) public {
        patients[_patient] = false;
    }

    function getAttrs() view public returns (string memory, string memory, string memory, bool, bool){
        return (name, url, metadataHash, open, active);
    }
}
