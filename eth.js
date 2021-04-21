import Web3 from "web3";
import contractFile from './scripts/readContract.run.js';

export default class ChainAdapter {
    constructor (props) {
      this._web3 = new Web3("ws://127.0.0.1:7545");
      this._abi = contractFile.abi;
      //testing on a ganache account - getting the first one
      this._account = props.address;
        // this._web3.eth.getAccounts().then((accounts) => {
        //     this._account = accounts[0];
        //     console.log(this._account);
        // });
    }

    async signReceipt (_receiptRequest){
        const { torrentHash } = _receiptRequest;
        console.log('signing receipt ' + torrentHash + ' with following account: ' + this._account);
        
        let signature = await this._web3.eth.sign(torrentHash.toString(), this._account)
        console.log("signature is: " + signature);
        return signature;
    }

    async _readContract (_contractAddress) {
      const contract = new this._web3.eth.Contract(this._abi, _contractAddress);
      const res = await contract.methods.getPermission(0).call();
      console.log(res);
      return [res[0], res[1]];
    }

    async hasPermissions(_contractAddress, _infohash) {
      console.log(_contractAddress);
      const [permissionOwner, contentHash] = await this._readContract(_contractAddress);
      
      if(permissionOwner == this._account && contentHash == _infohash){
        return true;
      } 
      return false;
    }
  }
  