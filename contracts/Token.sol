
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Token is ERC20, AccessControl {
    bytes32 public constant MINTER_BURNER_ROLE =
        keccak256("MINTER_BURNER_ROLE");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_BURNER_ROLE, msg.sender);
        _setRoleAdmin(MINTER_BURNER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_BURNER_ROLE)
    {
        _mint(to, amount);
    }
}
