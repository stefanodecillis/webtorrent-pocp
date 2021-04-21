// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract TorrentPermission {

    event PermissionAdded(address peer, string infohash);
    
    struct Permission {
        address peer;
        string infohash;
    }

    Permission[] public permissions;

    function _createPermission(address _peer, string memory _infohash) internal {
        permissions.push(Permission(_peer, _infohash));
        emit PermissionAdded(_peer, _infohash);
    }

    function addPermission(address _peer, string memory _infohash) public {
        _createPermission(_peer, _infohash);
    }

    function getPermission(uint _permissionId) external view returns(Permission memory){
        return permissions[_permissionId];
    }
}