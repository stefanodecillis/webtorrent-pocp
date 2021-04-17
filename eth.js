import Web3 from "web3"

export default class ChainAdapter {
    constructor (opts) {
      this._web3 = new Web3("ws://127.0.0.1:7545");

      //testing on a ganache account - getting the first one
        this._account = undefined;
        this._web3.eth.getAccounts().then((accounts) => {
            this._account = accounts[0];
            console.log(this._account);
        });
    }

    async signReceipt (receiptRequest){
        const { torrentHash } = receiptRequest;
        console.log('signing receipt ' + torrentHash + ' with following account: ' + this._account);
        
        let signature = await this._web3.eth.sign(torrentHash.toString(), this._account)
        console.log("signature is: " + signature);
        return signature;
    }
  }
  