import { resolve } from 'path';
import { readFileSync } from 'fs';
import solc from 'solc';

// Compile contract
const contractPath = resolve('./contracts/permissionContract.sol');
const source = readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
       './contracts/permissionContract.sol': {
          content: source,
       },
    },
    settings: {
       outputSelection: {
          '*': {
             '*': ['*'],
          },
       },
    },
 };
const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
const contractFile = tempFile.contracts['./contracts/permissionContract.sol']['TorrentPermission'];
export default contractFile;