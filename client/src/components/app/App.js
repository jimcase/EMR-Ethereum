import React, {Component} from "react";
import {sha256} from 'js-sha256';
import ReactDOM from "react-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardColumns,
  Col,
  Container,
  Form,
  FormControl,
  InputGroup,
  ListGroup,
  ListGroupItem,
  Nav,
  Navbar,
  NavDropdown,
  Row,
  Tab,
  Tabs
} from "react-bootstrap";
import MedicalRecordContract from "../../contracts/MedicalRecord.json";
import getWeb3 from "../../getWeb3";
import 'bootstrap/dist/css/bootstrap.min.css';
import CryptoJS from 'crypto-js';

import "./App.css";
import web3 from "web3";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    file: null,
    newFile: null,
    verified: false,
    isUser: false,

    requestNewDoctor: null,
    verifyHash: null,
    openDoctor: false,

    recordPatient: null,
    recordEncoding: 'SHA256',
    recordHash: null,

    // Register as patient
    patientNameValidated: null,
    patientName: null,

    // Verify feature
    verifyRecordDoctor: null,
    verifyRecordPatient: null,
    verifyRecordEncoding: null,
    verifyRecordHash: null,

    // As admin
    addDoctorAddress: null,
    addDoctorAddressValidated: null,
    addDoctorName: null,
    addDoctorNameValidated: null,
    addDoctorUrl: null,
    addDoctorUrlValidated: null,
    addDoctorMetadata: null,
    addDoctorMetadataValidated: null,

    requestNewDoctorAddr: null,

    newPatientInDoctor: null,

    // ANY
    getRecordHash: null,
    recordFound: [],
    getDoctorAddr: null,
    doctorFound: [],
    getPatientAddr: null,
    patientFound: [],

    // Events
    allEvents: [],
    networkDoctorsEvents: null,
    networkRecordsEvents: null,
    requestDoctorEvents: null,
    addPatientToDoctorEvents: null
  };

  constructor(props) {
    super(props);
    this.onChangeNewFile = this.onChangeNewFile.bind(this)
    this.onChangeVerifyFile = this.onChangeVerifyFile.bind(this)
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the current network
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = MedicalRecordContract.networks[networkId];
      // Get the contract instance.
      const instance = new web3.eth.Contract(
          MedicalRecordContract.abi,
          deployedNetwork && deployedNetwork.address,
      );

      this.setState({web3, accounts, contract: instance},
          this.getAllEvents);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  componentWillMount() {

    window.ethereum.on('accountsChanged', (_accounts) => {
      this.setState({accounts: _accounts});
      console.log("changed acc: " + _accounts);
    });

    window.ethereum.on('chainChanged', (_chainId) => window.location.reload());

  }

  stringIsValid(str) {

    return str != null && str !== "";
  }
  addressIsValid(address) {

    return web3.utils.isAddress(address);
  }

  registerAsPatient = async () => {

    const {accounts, contract} = this.state;

    if (this.stringIsValid(this.state.patientName)){

      this.setState({patientNameValidated: true});

      await contract.methods.registerAsPatient(this.state.patientName).send({from: accounts[0]}).catch((err) => {
        console.log("Failed with error: " + err);
      });
    }
    else {
      this.setState({patientNameValidated: false});
      console.log("not validated");
    }


  }

  registerNewDoctor = async () => {

    // Get web3 data
    const {accounts, contract} = this.state;

    // Get inputs from state
    const address = this.state.addDoctorAddress;
    const doctorName = this.state.addDoctorName;
    const url = this.state.addDoctorUrl;
    const metadata = this.state.addDoctorMetadata;

    // Check if they are valid
    let addressIsValid = this.addressIsValid(address);
    let doctorNameIsValid = this.stringIsValid(doctorName);
    let urlIsValid = this.stringIsValid(url);
    let metadataIsValid = this.stringIsValid(metadata);

    // update front in case not validated
    if (!addressIsValid){
      this.setState({addDoctorAddressValidated: false});
    }
    else{
      this.setState({addDoctorAddressValidated: true});
    }
    if (!doctorNameIsValid){
      this.setState({addDoctorNameValidated: false});
    }
    else{
      this.setState({addDoctorNameValidated: true});
    }
    if (!urlIsValid){
      this.setState({addDoctorUrlValidated: false});
    }
    else{
      this.setState({addDoctorUrlValidated: true});
    }
    if (!metadataIsValid){
      this.setState({addDoctorMetadataValidated: false});
    }
    else{
      this.setState({addDoctorMetadataValidated: true});
    }

    if (addressIsValid
        && doctorNameIsValid
        && urlIsValid
        && metadataIsValid
    ){
      await contract.methods.addDoctor(address,
          doctorName,
          url,
          metadata).send({from: accounts[0]}).catch((err) => {
          console.log("Failed with error: " + err);
      });
    }
  }

  requestNewDoctor = async () => {

    const {accounts, contract} = this.state;

    await contract.methods.requestDoctor(this.state.requestNewDoctorAddr).send({from: accounts[0]});
  }

  verifyRecord = async () => {

    const {accounts, contract} = this.state;

    await contract.methods.verifyRecord(this.state.verifyHash).send({from: accounts[0]});
  }

  addNewPatientInDoctor = async () => {

    const {accounts, contract} = this.state;

    await contract.methods.addNewPatient(this.state.newPatientInDoctor).send({from: accounts[0]});
  }

  switchOpen = async () => {

    const {accounts, contract} = this.state;
    await contract.methods.switchActiveDoctor().send({from: accounts[0]});
  }

  onClickSwitch = async () => {
    this.setState({openDoctor: !this.state.openDoctor},
        this.switchOpen)

  }
  addNewRecord = async () => {

    const {accounts, contract} = this.state;
    await contract.methods.addRecord(this.state.recordPatient, this.state.recordHash, this.state.recordEncoding).send({from: accounts[0]});
  }
  getRecord = async () => {

    const {accounts, contract} = this.state;

    contract.methods.getRecord(this.state.getRecordHash).call({from: accounts[0]}).then(r => {
      this.setState({recordFound: r});
    });

  }

  getDoctor = async () => {

    const {accounts, contract} = this.state;

    contract.methods.getDoctor(this.state.getDoctorAddr).call({from: accounts[0]}).then(r => {
      this.setState({doctorFound: r});
    });
  }

  getPatient = async () => {
    const {accounts, contract} = this.state;

    contract.methods.getPatient(this.state.getPatientAddr).call({from: accounts[0]}).then(r => {
      this.setState({patientFound: r});
    });
  }

  updateGetDoctorResult(result) {
    this.setState({doctorFound: result},
        //this.getCreatedDoctorEvents
        /*this.runExample*/);
  }

  getCreatedDoctorEvents = async () => {

    const {contract} = this.state;
    let events = await contract.getPastEvents('createDoctorLog', {});

    this.setState({
      networkDoctorsEvents: events
    });
  }

  getCreatedRecordEvents = async () => {

    const {contract} = this.state;
    let events = await contract.getPastEvents('verifiedRecordLog', {});

    this.setState({
      networkRecordsEvents: events
    });
  }

  getRequestDoctorEvents = async () => {

    const {contract} = this.state;
    let events = await contract.getPastEvents('requestDoctorLog', {});

  }

  getAddPatientEvents = async () => {

    const {contract} = this.state;
    let events = await contract.getPastEvents('patientAddedByDoctorLog', {});

    this.setState({
      addPatientToDoctorEvents: events
    });
  }

  getAllEvents = async () => {

    const {contract} = this.state;

    //let events = await contract.events.allEvents({fromBlock: 0, toBlock: 'latest'}).then(r => null);
    contract.events.allEvents({fromBlock: 0}, console.log);
    //console.log(events);

    contract.getPastEvents("allEvents",
        {
          fromBlock: 0,
          toBlock: 'latest' // You can also specify 'latest'
        })
        .then(events => {
          this.setState({allEvents: events});
          console.log(events);
        })
        .catch((err) => console.error(err));
  }


  onChangeVerifyFile(e) {

    var file = e.target.files[0];
    console.log("type: " + typeof (file));


    var fileByteArray = [];

    console.log((fileByteArray));
    console.log(sha256("hello"));

    console.log('encrypted-CryptoJS: ' + CryptoJS.SHA256(file).toString(CryptoJS.enc.Hex));
    //var sha256HexValue = asmCrypto.SHA256.hex(file);

    this.setState({
      file: CryptoJS.SHA256(file).toString(CryptoJS.enc.Hex)
    }, () => {
      console.log("hash uploaded: " + this.state.file);
    });

  }

  onChangeNewFile(e) {

    this.setState({
      newFile: e.target.files[0]
    }, () => {
      console.log("new file uploaded" + this.state.newFile);
    });
  }

  getSelectValue = () => {
    /* Here's the key solution */
    this.setState({recordEncoding: ReactDOM.findDOMNode(this.select).value});
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
        <div className="App">
          <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
            <Navbar.Brand href="#home">
              Poscare
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link href="#features">Profile</Nav.Link>
                <Nav.Link href="#pricing">Network</Nav.Link>
                <NavDropdown title="Options" id="collasible-nav-dropdown">
                  <NavDropdown.Item href="#action/3.1">first</NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.2">
                    Another action
                  </NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                  <NavDropdown.Divider/>
                  <NavDropdown.Item href="#action/3.4">
                    Separated link
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
              <Nav>
                <Nav.Link href="#deets">Sign out</Nav.Link>
                <Nav.Link eventKey={2} href="#memes">
                  +
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>

          <Container>
          </Container>
          <Row className="mainNavContainer">
            <Container>
              <h1>
                Electronic Medical Records
              </h1>
            </Container>
          </Row>


          <Row>

            <Container>
              {/* Home page */}
              <div className="Home">

                <Container>
                  <Tabs defaultActiveKey="home" id="uncontrolled-tab-example">
                    <Tab eventKey="home" title="Profile">
                      <Card>

                        <Card.Body>
                          <Row>
                            <Col xs={12} md={4}>
                              <Card style={{width: '18rem'}}>
                                <Card.Img variant="top" src={require("../../assets/profileImg.png")}/>
                                <Card.Body>
                                  <Card.Title></Card.Title>
                                  <Card.Text>
                                    {this.state.accounts[0]}
                                  </Card.Text>
                                </Card.Body>
                                <ListGroup className="list-group-flush">
                                  <ListGroupItem>
                                    <InputGroup className="mb-3">
                                      <InputGroup.Prepend>
                                        <InputGroup.Text id="basic-addon1">Name</InputGroup.Text>
                                      </InputGroup.Prepend>
                                      <FormControl
                                          style={{background:
                                                  this.state.patientNameValidated === false ? (
                                                   '#b66d60'
                                                    ) : (
                                                    'none'
                                                  )}
                                            }
                                          placeholder="Enter your name"
                                          aria-label="patientName"
                                          aria-describedby="basic-addon1"
                                          onChange={e => this.setState({patientName: e.target.value})}
                                      />
                                    </InputGroup>
                                    <Button variant="primary"
                                            onClick={this.registerAsPatient}>
                                      Register as patient
                                    </Button>

                                  </ListGroupItem>

                                </ListGroup>
                              </Card>
                            </Col>
                            <Col xs={12} md={8}>
                              <Card>
                                <Card.Header><h3>As Admin</h3></Card.Header>
                                <Card.Body>
                                  <Card.Title>Actions</Card.Title>
                                  <Card.Text>
                                    <Card style={{}}>
                                      <ListGroup variant="flush">
                                        <ListGroup.Item>
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                style={{background:
                                                      this.state.addDoctorAddressValidated === false ? (
                                                          '#b66d60'
                                                      ) : (
                                                          'none'
                                                      )}
                                                }
                                                placeholder="Doctor address"
                                                aria-label="Username"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({addDoctorAddress: e.target.value})}
                                            />
                                          </InputGroup>
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">Name</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                style={{background:
                                                      this.state.addDoctorNameValidated === false ? (
                                                          '#b66d60'
                                                      ) : (
                                                          'none'
                                                      )}
                                                }
                                                placeholder="name"
                                                aria-label="Name"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({addDoctorName: e.target.value})}
                                            />
                                          </InputGroup>
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">URL</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                style={{background:
                                                      this.state.addDoctorUrlValidated === false ? (
                                                          '#b66d60'
                                                      ) : (
                                                          'none'
                                                      )}
                                                }
                                                placeholder="url to *.json"
                                                aria-label="url"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({addDoctorUrl: e.target.value})}
                                            />
                                          </InputGroup>
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">Metadata hash</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                style={{background:
                                                      this.state.addDoctorMetadataValidated === false ? (
                                                          '#b66d60'
                                                      ) : (
                                                          'none'
                                                      )}
                                                }
                                                placeholder="metadata hash"
                                                aria-label="Metadata"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({addDoctorMetadata: e.target.value})}
                                            />
                                          </InputGroup>
                                          <Button variant="primary"
                                                  onClick={this.registerNewDoctor}>
                                            Add new doctor
                                          </Button>

                                        </ListGroup.Item>
                                      </ListGroup>
                                    </Card>
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                              <Card>
                                <Card.Header><h3>As patient</h3></Card.Header>
                                <Card.Body>
                                  <Card.Title>Actions</Card.Title>
                                  <Card.Text>
                                    <Card style={{}}>
                                      <ListGroup variant="flush">
                                        <ListGroup.Item>
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                placeholder="Request new doctor (address)"
                                                aria-label="Address"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({requestNewDoctorAddr: e.target.value})}
                                            />
                                            <Button variant="primary" onClick={this.requestNewDoctor}>Request</Button>
                                          </InputGroup>

                                        </ListGroup.Item>
                                      </ListGroup>
                                    </Card>
                                  </Card.Text>

                                  <Card className="text-center" style={{marginTop: '50px'}}>
                                    <Card.Header><h4>Verify Record<Badge variant="secondary">New</Badge></h4>
                                    </Card.Header>
                                    <Card.Body>
                                      <Card.Title></Card.Title>
                                      <Card.Text>
                                        <Form>

                                          <Form.Group as={Row} controlId="formPlaintextPassword">

                                            <Col sm="12">
                                              <InputGroup className="mb-3">
                                                <InputGroup.Prepend>
                                                  <InputGroup.Text id="basic-addon1">hash</InputGroup.Text>
                                                </InputGroup.Prepend>
                                                <FormControl
                                                    placeholder="file hash"
                                                    aria-label="Username"
                                                    aria-describedby="basic-addon1"
                                                    onChange={e => this.setState({verifyHash: e.target.value})}
                                                />
                                              </InputGroup>
                                            </Col>
                                          </Form.Group>
                                        </Form>
                                        <Button variant="primary" onClick={this.verifyRecord}>Verify</Button>
                                      </Card.Text>
                                    </Card.Body>
                                    <Card.Footer className="text-muted">

                                    </Card.Footer>
                                  </Card>
                                </Card.Body>
                              </Card>

                              <Card>
                                <Card.Header><h3>As Doctor</h3></Card.Header>
                                <Card.Body>
                                  <Card.Title>Actions</Card.Title>
                                  <Card.Text>
                                    <Card style={{}}>
                                      <ListGroup variant="flush">
                                        <ListGroup.Item>
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                placeholder="Add new patient (address)"
                                                aria-label="Username"
                                                aria-describedby="basic-addon1"
                                                onChange={e =>
                                                    this.setState({newPatientInDoctor: e.target.value})}
                                            />
                                            <Button variant="primary" onClick={this.addNewPatientInDoctor}>Add</Button>
                                          </InputGroup>

                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <Button variant="outline-secondary"
                                                      onClick={this.onClickSwitch}
                                              >Switch</Button>
                                            </InputGroup.Prepend>
                                            <FormControl aria-describedby="basic-addon1"
                                                         placeholder={
                                                           this.state.openDoctor ? (
                                                               "Open to new patients"
                                                           ) : (
                                                               "Close to new patients"
                                                           )
                                                         }
                                                         readOnly={"state"}/>
                                          </InputGroup>
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                          <h4>Add new Record</h4>
                                          <Form>
                                            <Form.Group as={Row} controlId="formPlaintextDoctor">

                                              <Form.Label column sm="2">
                                                Doctor
                                              </Form.Label>
                                              <Col sm="10">
                                                <Form.Control plaintext readOnly defaultValue={this.state.accounts[0]}/>
                                              </Col>
                                            </Form.Group>

                                            <Form.Group as={Row} controlId="formPlaintextPassword">
                                              <Form.Label column sm="2">
                                                Patient
                                              </Form.Label>
                                              <Col sm="10">
                                                <InputGroup className="mb-3">
                                                  <InputGroup.Prepend>
                                                    <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                                  </InputGroup.Prepend>
                                                  <FormControl
                                                      placeholder="Address"
                                                      aria-label="Username"
                                                      aria-describedby="basic-addon1"
                                                      onChange={e => this.setState({recordPatient: e.target.value})}
                                                  />
                                                </InputGroup>
                                              </Col>
                                            </Form.Group>
                                            <Form.Group as={Row} controlId="formPlaintextPassword">
                                              <Form.Label column sm="2">
                                                Encoding
                                              </Form.Label>
                                              <Col sm="10">
                                                <Form.Control as="select"
                                                              defaultValue="SHA256"
                                                              onChange={this.getSelectValue}>
                                                  <option>SHA252</option>
                                                  <option>...</option>
                                                </Form.Control>
                                              </Col>
                                            </Form.Group>

                                            <Form.Group as={Row} controlId="formPlaintextPassword">
                                              <Form.Label column sm="2">
                                                File
                                              </Form.Label>
                                              <Col sm="10">
                                                <Form.File id="exampleFormControlFile1" disabled label=""
                                                           onChange={this.onChangeVerifyFile}/>
                                              </Col>
                                            </Form.Group>
                                          </Form>

                                          <Form.Group as={Row} controlId="formPlaintextPassword">
                                            <Form.Label column sm="2">
                                              or
                                            </Form.Label>
                                            <Col sm="10">
                                              <InputGroup className="mb-3">
                                                <InputGroup.Prepend>
                                                  <InputGroup.Text id="basic-addon1">hash</InputGroup.Text>
                                                </InputGroup.Prepend>
                                                <FormControl
                                                    placeholder="file hash"
                                                    aria-label="Username"
                                                    aria-describedby="basic-addon1"
                                                    onChange={e => this.setState({recordHash: e.target.value})}
                                                />
                                              </InputGroup>
                                            </Col>
                                          </Form.Group>

                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                          <Button variant="primary" onClick={this.addNewRecord}>Submit</Button>
                                        </ListGroup.Item>
                                      </ListGroup>
                                    </Card>
                                  </Card.Text>
                                </Card.Body>
                              </Card>

                              <Card className="text-center" style={{marginTop: '50px'}}>
                                <Card.Header><h2>Verify Record<Badge variant="secondary">New</Badge></h2></Card.Header>
                                <Card.Body>
                                  <Card.Title>Upload a file</Card.Title>
                                  <Card.Text>
                                    <Form>
                                      <Form.Group as={Row} controlId="formPlaintextDoctor">
                                        <Form.Label column sm="2">
                                          Doctor
                                        </Form.Label>
                                        <Col sm="10">
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                placeholder="Address"
                                                aria-label="Username"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({verifyRecordDoctor: e.target.value})}
                                            />
                                          </InputGroup>
                                        </Col>
                                      </Form.Group>

                                      <Form.Group as={Row} controlId="formPlaintextPassword">
                                        <Form.Label column sm="2">
                                          Patient
                                        </Form.Label>
                                        <Col sm="10">
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                placeholder="Address"
                                                aria-label="Username"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({verifyRecordPatient: e.target.value})}
                                            />
                                          </InputGroup>
                                        </Col>
                                      </Form.Group>
                                      <Form.Group as={Row} controlId="formPlaintextPassword">
                                        <Form.Label column sm="2">
                                          Encoding
                                        </Form.Label>
                                        <Col sm="10">
                                          <Form.Control as="select" defaultValue="Choose..."
                                                        onChange={e => this.setState({verifyRecordEncoding: e.target.value})}>
                                            <option>SHA252</option>
                                            <option>...</option>
                                          </Form.Control>
                                        </Col>
                                      </Form.Group>

                                      <Form.Group as={Row} controlId="formPlaintextPassword">
                                        <Form.Label column sm="2">
                                          File
                                        </Form.Label>
                                        <Col sm="10">
                                          <Form.File id="exampleFormControlFile1" disabled label=""
                                                     onChange={this.onChangeVerifyFile}/>
                                        </Col>
                                      </Form.Group>

                                      <Form.Group as={Row} controlId="formPlaintextPassword">
                                        <Form.Label column sm="2">
                                          or
                                        </Form.Label>
                                        <Col sm="10">
                                          <InputGroup className="mb-3">
                                            <InputGroup.Prepend>
                                              <InputGroup.Text id="basic-addon1">hash</InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <FormControl
                                                placeholder="file hash"
                                                aria-label="Username"
                                                aria-describedby="basic-addon1"
                                                onChange={e => this.setState({verifyRecordHash: e.target.value})}
                                            />
                                          </InputGroup>
                                        </Col>
                                      </Form.Group>
                                    </Form>
                                    <Button variant="primary">Verify</Button>
                                  </Card.Text>
                                </Card.Body>
                                <Card.Footer className="text-muted">
                                  <p>Hash:</p>{this.state.file}
                                  <h5>Verified {this.state.verified ? (
                                      <p>YES</p>
                                  ) : (
                                      <p>NO</p>
                                  )}</h5>
                                </Card.Footer>
                              </Card>
                            </Col>

                          </Row>

                        </Card.Body>

                      </Card>


                    </Tab>
                    <Tab eventKey="network" title="Your network">
                      <Card>

                        <Card.Body>
                          <Row>
                            <Col xs={12}>
                              <Card style={{}}>
                                <ListGroup variant="flush">
                                  <ListGroup.Item>
                                    <InputGroup className="mb-3">
                                      <InputGroup.Prepend>
                                        <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                      </InputGroup.Prepend>
                                      <FormControl
                                          placeholder="Search a patient"
                                          aria-label="Address"
                                          aria-describedby="basic-addon1"
                                          onChange={e => this.setState({getPatientAddr: e.target.value})}
                                      />
                                      <Button variant="primary" onClick={this.getPatient}>Search</Button>
                                    </InputGroup>

                                  </ListGroup.Item>
                                </ListGroup>
                                <div>
                                  <p>Result:</p>
                                  {this.state.patientFound[0] ? (
                                      <p>Name: {this.state.patientFound[0]}</p>
                                  ) : (
                                      <p></p>
                                  )}
                                  {this.state.patientFound[1] ? (
                                      <p>Status: Active</p>
                                  ) : (
                                      <p></p>
                                  )}
                                </div>
                              </Card>
                              <Card style={{}}>
                                <ListGroup variant="flush">
                                  <ListGroup.Item>
                                    <InputGroup className="mb-3">
                                      <InputGroup.Prepend>
                                        <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                      </InputGroup.Prepend>
                                      <FormControl
                                          placeholder="Search a doctor"
                                          aria-label="Address"
                                          aria-describedby="basic-addon1"
                                          onChange={e => this.setState({getDoctorAddr: e.target.value})}
                                      />
                                      <Button variant="primary" onClick={this.getDoctor}>Search</Button>
                                    </InputGroup>
                                  </ListGroup.Item>
                                </ListGroup>

                                <div>
                                  <p>Result:</p>
                                  {this.state.doctorFound[0] ? (
                                      <p>Name: {this.state.doctorFound[0]}</p>
                                  ) : (
                                      <p></p>
                                  )}
                                  {this.state.doctorFound[1] ? (
                                      <p>Url: {this.state.doctorFound[1]}</p>
                                  ) : (
                                      <p></p>
                                  )}
                                  {this.state.doctorFound[2] ? (
                                      <p>Metadata hash: {this.state.doctorFound[2]}</p>
                                  ) : (
                                      <p></p>
                                  )}
                                  {this.state.doctorFound[3] ? (
                                      <p>Is Open {this.state.doctorFound[3]}</p>
                                  ) : (
                                      <p></p>
                                  )}
                                  {this.state.doctorFound[4] ? (
                                      <p>Is Active {this.state.doctorFound[4]}</p>
                                  ) : (
                                      <p></p>
                                  )}
                                </div>
                              </Card>
                              <Tabs defaultActiveKey="doctors" id="uncontrolled-tab-example2"
                                    style={{marginTop: '50px'}}>
                                <Tab eventKey="doctors" title="Doctors(in development)" style={{paddingTop: '30px'}}>

                                  <CardColumns>
                                    <Card>
                                      <Card.Img variant="top" src={require("../../assets/doc1.jpg")}/>
                                      <Card.Body>
                                        <Card.Title>Card title</Card.Title>
                                        <Card.Text>
                                          This card has supporting text below as a natural lead-in to additional
                                          content.{' '}
                                          <small className="text-muted">
                                            Someone famous in <cite title="Source Title">Source Title</cite>
                                          </small>
                                        </Card.Text>
                                      </Card.Body>
                                      <Card.Footer>
                                        <small className="text-muted">Last updated 3 mins ago</small>
                                      </Card.Footer>
                                    </Card>
                                    <Card>
                                      <Card.Img variant="top" src={require("../../assets/doc2.jpg")}/>
                                      <Card.Body>
                                        <Card.Title>Card title</Card.Title>
                                        <Card.Text>
                                          This card has supporting text below as a natural lead-in to additional
                                          content.{' '}
                                          <small className="text-muted">
                                            Someone famous in <cite title="Source Title">Source Title</cite>
                                          </small>
                                        </Card.Text>
                                      </Card.Body>
                                      <Card.Footer>
                                        <small className="text-muted">Last updated 3 mins ago</small>
                                      </Card.Footer>
                                    </Card>


                                    <Card>
                                      <Card.Img variant="top" src={require("../../assets/doc3.jpg")}/>
                                      <Card.Body>
                                        <Card.Title>Card title</Card.Title>
                                        <Card.Text>
                                          This card has supporting text below as a natural lead-in to additional
                                          content.{' '}
                                          <small className="text-muted">
                                            Someone famous in <cite title="Source Title">Source Title</cite>
                                          </small>
                                        </Card.Text>
                                      </Card.Body>
                                      <Card.Footer>
                                        <small className="text-muted">Last updated 3 mins ago</small>
                                      </Card.Footer>
                                    </Card>

                                    {this.state.networkDoctorsEvents ? (
                                        <Card>
                                          <Card.Img variant="top" src={require("../../assets/doc3.jpg")}/>
                                          <Card.Body>
                                            <Card.Title>Doctor title</Card.Title>
                                            <Card.Text>
                                              This card has supporting text below as a natural lead-in to additional
                                              content.{' '}
                                              <small className="text-muted">
                                                Someone famous in <cite title="Source Title">Source Title</cite>
                                              </small>
                                            </Card.Text>
                                          </Card.Body>
                                          <Card.Footer>
                                            <small className="text-muted">Last updated 3 mins ago</small>
                                          </Card.Footer>
                                        </Card>
                                    ) : (
                                        <p>Not doctors found from events</p>
                                    )}

                                  </CardColumns>
                                </Tab>

                              </Tabs>

                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab>
                    <Tab eventKey="records" title="Records">
                      <Card style={{}}>
                        <ListGroup variant="flush">
                          <ListGroup.Item>
                            <InputGroup className="mb-3">
                              <InputGroup.Prepend>
                                <InputGroup.Text id="basic-addon1">Hash</InputGroup.Text>
                              </InputGroup.Prepend>
                              <FormControl
                                  placeholder="Search a record"
                                  aria-label="Address"
                                  aria-describedby="basic-addon1"
                                  onChange={e => this.setState({getRecordHash: e.target.value})}
                              />
                              <Button variant="primary" onClick={this.getRecord}>Search</Button>
                            </InputGroup>

                          </ListGroup.Item>
                        </ListGroup>
                        <div>
                          <p>Result: </p>
                          {this.state.recordFound[0] ? (
                              <p>Doctor: {this.state.recordFound[0]}</p>
                          ) : (
                              <p></p>
                          )}
                          {this.state.recordFound[1] ? (
                              <p>Patient: {this.state.recordFound[1]}</p>
                          ) : (
                              <p></p>
                          )}
                          {this.state.recordFound[2] ? (
                              <p>Encoding: {this.state.recordFound[2]}</p>
                          ) : (
                              <p></p>
                          )}
                          {this.state.recordFound[3] ? (
                              <p>Verified: YES </p>
                          ) : (
                              <p></p>
                          )}
                        </div>
                      </Card>
                    </Tab>

                    <Tab eventKey="events" title="Events">

                      {
                        this.state.allEvents.map(function (item, i) {
                          console.log('test');
                          return <div>
                            <Alert variant="success" style={{margin: '10px', maxWidth: '100%'}}>
                              <Alert.Heading> {JSON.stringify(item.event)} ({i})</Alert.Heading>
                              <div>
                                <pre style={{minHeight: '50px'}}>{JSON.stringify(item.returnValues)}</pre>

                              </div>
                              <hr/>
                              <p className="mb-0">
                                <p>
                                  Block number:{item.blockNumber}
                                </p>
                                <p>
                                  Block hash: {item.blockHash}
                                </p>
                              </p>
                            </Alert>
                          </div>

                        })
                      }


                    </Tab>

                  </Tabs>

                </Container>
              </div>


            </Container>

          </Row>
        </div>
    );
  }
}

export default App;
