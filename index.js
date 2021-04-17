import wt_pocp from '../wt_pocp/index.js'
import Debug from 'debug'
import WebTorrent from 'webtorrent'
const debug = Debug('WebTorrentPocp')

export default class WebTorrentPocp extends WebTorrent {

  _client = null; //_client is used for testing -- "seeder" you re the seeder "peer" you re the peer 

  constructor (opts, client) {
    super(opts);
    this._client = client;
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

    wire.use(wt_pocp())
    wire.wt_pocp.on('pocp_handshake', (handshake) => {
      debug('Got extended handshake', handshake)
      //console.log('got extended handshake: ' + handshake);
      //console.log(handshake);
      // here goes the info during the handshake
    //   console.log('forcing deny');
    //   wire.wt_pocp.deny();
    
      if(this._client == 'seeder'){
        console.log('allowing');
        wire.wt_pocp.allow();
      }
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

    // seeder says we don't have permissions
    if(this._client=='peer'){
      wire.wt_pocp.on('negative', () => {
        //console.log('getting negative response')
      })
    }

    // Pay peers who we are downloading from
    wire.wt_pocp.on('positive', ()=>{
        //console.log('getting positive response')
    });


    wire.wt_pocp.on('warning', (err) => {
      debug('Error', err)
    })


    wire.wt_pocp.on('signature-request', (data) => {
      console.log('data content: ' + data.toString())
      console.log('torrent hash: ' + data.hash)
      wire.wt_pocp.sendSignedReceipt();
      console.log('sent signed receipt');
    })



    wire.wt_pocp.on('signature-response', () => {
      console.log('end of the communication');
    })


    wire.on('upload', function(bytes){
      console.log(this._client +' for torrent progress: ' + torrent.progress);
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