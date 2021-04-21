import wt_pocp from '../wt_pocp/index.js'
import Debug from 'debug'
import WebTorrent from 'webtorrent'
import ChainAdapter from './eth.js';
const debug = Debug('WebTorrentPocp')

export default class WebTorrentPocp extends WebTorrent {

  constructor (props, client) {
    super(props);
    this._client = client;  //_client is used for testing -- "seeder" you re the seeder "peer" you re the peer 
    this._accountAddress = '0xEE75Ec552285ac96A39708318aBb16B692dA2D22'; //props.address;
    this._chainAdapter = new ChainAdapter({address:this._accountAddress});
  }

  seed () { 
    const torrent = WebTorrent.prototype.seed.apply(this, arguments)
    this._setupTorrent(torrent)
    return torrent
  }

  add () {
    const torrent = WebTorrent.prototype.add.apply(this, arguments)
    this._setupTorrent(torrent)
    return torrent
  }

  _setupWire (torrent, wire) {
    debug('attaching wire')
    const _this = this;
    wire.use(wt_pocp());
    wire.wt_pocp.on('pocp_handshake', async function (handshake) {
      debug('Got extended handshake', handshake)
      if(_this._client == 'peer'){
        wire.wt_pocp.sendCheckin();
      }
      const isAuthorized = await _this._chainAdapter.hasPermissions('0xE2c9BDEE13513e6ecD27dab715D3e95D7A31Ceab', 'torrent'); // replace 'torrent' with infohash
      if(isAuthorized){
        console.log('allowing');
        wire.wt_pocp.allow();
      } else {
        console.log('denying');
        wire.wt_pocp.deny();
      }

      // const _onRequest = wire.wt_pocp._onRequest
      // wire.wt_pocp._onRequest = function (index, offset, length) {
      //   //_this.emit('request', index, offset, length)

      //   // Call onRequest after the handlers triggered by this event have been called
      //   const _arguments = arguments

      //   if(isAuthorized){
      //     setTimeout(function () {
      //       if (!wire.wt_pocp.amForceChoking) {
      //         console.log('responding to request')
      //         _onRequest.apply(wire, _arguments)
      //       } else {
      //         console.log('force choking peer')
      //       }
      //     }, 0)
      //   }
      // }
      // if(this.client == 'seeder'){
      //   console.log('allowing');
      //   wire.wt_pocp.allow();
      // }
    })
    // read the smart contract of peers for requesting data from us
    //wire.wt_pocp.on('request', this._chargePeerForRequest.bind(this, wire, torrent))

        //compute effort
    // wire.on('download', (bytes) => {
    //   debug('downloaded ' + bytes + ' bytes (' + wire.wt_pocp.peerPublicKey.slice(0, 8) + ')')
    //   this.decider.recordDelivery({
    //     publicKey: wire.wt_pocp.peerPublicKey,
    //     torrentHash: torrent.infoHash,
    //     bytes: bytes,
    //     timestamp: moment().toISOString()
    //   })
    // })

    wire.wt_pocp.on('check-in', async function() {
      console.log('got checkin');
    })

    // seeder says we don't have permissions
    wire.wt_pocp.on('no-autohorized', () => {
      //console.log('getting negative response')
    })

    // Pay peers who we are downloading from
    wire.wt_pocp.on('authorized', ()=>{
        //console.log('getting positive response')
        console.log(wire.requests[0]);
    });


    wire.wt_pocp.on('warning', (err) => {
      debug('Error', err)
    })


    wire.wt_pocp.on('signature-request', (data) => {
      console.log('torrent hash: ' + data.hash)

      const receiptRequest = {
        torrentHash: data.hash
      }
      
      /***********
       * signing *
      ************/

      this._chainAdapter.signReceipt(receiptRequest).then((signature) => {
        const receiptResponse = {
          request: receiptRequest,
          signature: signature
        }
        wire.wt_pocp.sendSignedReceipt(receiptResponse);
        console.log('sent signed receipt');
      });
    })



    wire.wt_pocp.on('signature-response', (signedReceipt) => {
      console.log('signature: '+ signedReceipt.signature);
      console.log('end of the communication');
    })


    wire.on('upload', function(){ //considering on 'upload'
      console.log(_this._client +' for torrent progress: ' + torrent.progress);
      if(torrent.progress == 1){
        console.log('torrent.name -> ' + torrent.name)
        wire.wt_pocp.sendReceipt(torrent.name);
      }
      
    });
  }
  _setupTorrent (torrent) {
    if (torrent.__setupWithPocp) {
      return torrent
    }

    console.log('Setting up torrent with POCP details for '+ this._client)

    torrent.on('wire', this._setupWire.bind(this, torrent))

    torrent.on('error', (err) => {
      debug('torrent error:', err)
    })
    
    torrent.__setupWithPocp = true
  }
}

// Note that using module.exports instead of export const here is a hack
// to make this work with https://github.com/59naga/babel-plugin-add-module-exports
//module.exports.WEBRTC_SUPPORT = WebTorrent.WEBRTC_SUPPORT