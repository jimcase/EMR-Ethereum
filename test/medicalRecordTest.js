const MedicalRecord = artifacts.require("./MedicalRecord.sol");

contract("MedicalRecord", accounts => {

    let medicalRecord;
    let admin;
    let patients;
    let doctors;

    beforeEach("Set up contract for each test", async () => {

        admin = accounts[0];
        //console.log("admin: "+admin);

        patients = [accounts[1],
            accounts[2],
            accounts[3],
            accounts[4]
        ];

        doctors = [accounts[5], accounts[6]];

        medicalRecord = await MedicalRecord.deployed();
    });


    it('ensure that a specific patient was registered', async () => {
        await medicalRecord.registerAsPatient('jaime1', {from: patients[0]});

        let p = await medicalRecord.getPatient(patients[0]);

        let expectedName = 'jaime1';
        let expectedActive = true;

        assert.equal(p[0], expectedName, "The address should be a patient");
        assert.equal(p[1], expectedActive, "The address should be a patient");

    });

    it('ensure that a specific doctor is created by the admin', async () => {
        await medicalRecord.addDoctor(doctors[0], 'doc1', 'www.doc1.com', 'hbadutb476gt7vd6tvf', {from: admin});

        let d = await medicalRecord.getDoctor(doctors[0]);

        let expectedName = 'doc1';
        let url = 'www.doc1.com';
        let metadatos = 'hbadutb476gt7vd6tvf';
        let open = false;
        let active = true;

        assert.equal(d[0], expectedName, "The address should be a patient");
        assert.equal(d[1], url, "The address should be a patient");
        assert.equal(d[2], metadatos, "The address should be a patient");
        assert.equal(d[3], open, "The address should be a patient");
        assert.equal(d[4], active, "The address should be a patient");

    });

    it('ensure that a doctor is requested by specific patient', async () => {

        // create a patient
        await medicalRecord.registerAsPatient('jaime1', {from: patients[0]});
        // add new doctor by admin
        await medicalRecord.addDoctor(doctors[0], 'doc1', 'www.doc1.com', 'hbadutb476gt7vd6tvf', {from: admin});

        // activate doctor
        await medicalRecord.switchActiveDoctor({from: doctors[0]});

        // request doctor by the patient
        await medicalRecord.requestDoctor(doctors[0], {from: patients[0]});

        let isMyDoctor = await medicalRecord.doctorInPatient(doctors[0], patients[0]);
        assert.equal(isMyDoctor, true, "The address should be a patient");

    });

    it('TODO', async () => {

        // create a patient
        await medicalRecord.registerAsPatient('jaime1', {from: patients[0]});
        // add new doctor by admin
        await medicalRecord.addDoctor(doctors[0], 'doc1', 'www.doc1.com', 'hbadutb476gt7vd6tvf', {from: admin});

        // activate doctor
        await medicalRecord.switchActiveDoctor({from: doctors[0]});

        // request doctor by the patient
        await medicalRecord.requestDoctor(doctors[0], {from: patients[0]});

        // 1. Check before add the patient
        let isMyDoctor = await medicalRecord.patientInDoctor(patients[0], doctors[0]);

        assert.equal(isMyDoctor, false, "The address should be a patient");

        // Add the patient by the doctor
        await medicalRecord.addNewPatient(patients[0], {from: doctors[0]});

        // 2. Check after add the patient
        isMyDoctor = await medicalRecord.patientInDoctor(patients[0], doctors[0]);

        assert.equal(isMyDoctor, true, "The address should be a patient");

    });

    it('ensure that a record was added and verified', async () => {
        // create a patient
        await medicalRecord.registerAsPatient('jaime1', {from: patients[0]});
        // add new doctor by admin
        await medicalRecord.addDoctor(doctors[0], 'doc1', 'www.doc1.com', 'hbadutb476gt7vd6tvf', {from: admin});

        // activate doctor
        await medicalRecord.switchActiveDoctor({from: doctors[0]});

        // request doctor by the patient
        await medicalRecord.requestDoctor(doctors[0], {from: patients[0]});

        // Add the patient by the doctor
        await medicalRecord.addNewPatient(patients[0], {from: doctors[0]});

        // Add a record
        let hash = 'bhaudyb8239t637as';
        let encoding = 'SHA256';

        await medicalRecord.addRecord(patients[0], hash, encoding, {from: doctors[0]});

        let r = await medicalRecord.getRecord(hash, {from: doctors[0]});

        assert.equal(r[0], doctors[0], "Incorrect doctor");
        assert.equal(r[1], patients[0], "Incorrect patient");
        assert.equal(r[2], encoding, "Incorrect encoding");
        assert.equal(r[3], false, "The record should not be verified");

        await medicalRecord.verifyRecord(hash, {from: patients[0]});

        r = await medicalRecord.getRecord(hash, {from: doctors[2]});
        assert.equal(r[3], true, "The record should be verified");

    });
});

// TODO test events, worst scenarios