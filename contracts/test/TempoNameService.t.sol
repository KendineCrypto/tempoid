// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TempoNameService.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPathUSD is ERC20 {
    constructor() ERC20("pathUSD", "pathUSD") {
        _mint(msg.sender, 1_000_000 * 1e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract TempoNameServiceTest is Test {
    TempoNameService public tns;
    MockPathUSD public token;

    address public deployer = address(this);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xC0C);

    function setUp() public {
        token = new MockPathUSD();
        tns = new TempoNameService(address(token));

        token.transfer(alice, 10_000 * 1e6);
        token.transfer(bob, 10_000 * 1e6);
        token.transfer(charlie, 10_000 * 1e6);

        vm.prank(alice);
        token.approve(address(tns), type(uint256).max);
        vm.prank(bob);
        token.approve(address(tns), type(uint256).max);
        vm.prank(charlie);
        token.approve(address(tns), type(uint256).max);
    }

    // ==================== Registration ====================

    function test_Register() public {
        vm.prank(alice);
        tns.register("alice", 1);
        (address o, , , ) = tns.getNameInfo("alice");
        assertEq(o, alice);
    }

    function test_RegisterAutoSetsPrimary() public {
        vm.prank(alice);
        tns.register("alice", 1);
        assertEq(tns.reverseLookup(alice), "alice");
    }

    function test_RegisterAddsToOwnedNames() public {
        vm.prank(alice);
        tns.register("alice", 1);
        string[] memory n = tns.getNamesOfOwner(alice);
        assertEq(n.length, 1);
        assertEq(n[0], "alice");
    }

    function test_RegisterMultiple() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.register("alice2", 1);
        vm.prank(alice);
        tns.register("alice3", 1);
        assertEq(tns.getNameCount(alice), 3);
    }

    function test_RegisterFees() public {
        assertEq(tns.getRegistrationFee("abc", 1), 20 * 1e6);
        assertEq(tns.getRegistrationFee("abcd", 1), 5 * 1e6);
        assertEq(tns.getRegistrationFee("abcde", 1), 1 * 1e6);
        assertEq(tns.getRegistrationFee("abcde", 3), 3 * 1e6);
    }

    function test_RegisterRevertsTaken() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(bob);
        vm.expectRevert(TempoNameService.NameNotAvailable.selector);
        tns.register("alice", 1);
    }

    function test_RegisterRevertsInvalid() public {
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("ab", 1);

        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("-abc", 1);

        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("ABC", 1);
    }

    function test_RegisterRevertsZeroYears() public {
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidDuration.selector);
        tns.register("alice", 0);
    }

    function test_RegisterExpiredClearsOldData() public {
        vm.prank(alice);
        tns.register("testname", 1);
        vm.prank(alice);
        tns.setMetadata("testname", "avatar", "https://old.com");

        vm.warp(block.timestamp + 365 days + 31 days);

        vm.prank(bob);
        tns.register("testname", 1);

        assertEq(tns.getMetadata("testname", "avatar"), "");
        assertEq(tns.getNameCount(alice), 0);
        assertEq(tns.getNameCount(bob), 1);
    }

    // ==================== Resolution ====================

    function test_Resolve() public {
        vm.prank(alice);
        tns.register("alice", 1);
        assertEq(tns.resolve("alice"), alice);
    }

    function test_ResolveRevertsExpired() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.warp(block.timestamp + 366 days);
        vm.expectRevert(TempoNameService.NameExpired.selector);
        tns.resolve("alice");
    }

    function test_ReverseLookupNoPrimary() public {
        vm.expectRevert(TempoNameService.NoPrimaryName.selector);
        tns.reverseLookup(alice);
    }

    // ==================== Management ====================

    function test_Renew() public {
        vm.prank(alice);
        tns.register("alice", 1);
        (, uint256 e1, , ) = tns.getNameInfo("alice");
        vm.prank(alice);
        tns.renew("alice", 1);
        (, uint256 e2, , ) = tns.getNameInfo("alice");
        assertEq(e2, e1 + 365 days);
    }

    function test_RenewGracePeriod() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.warp(block.timestamp + 366 days);
        vm.prank(alice);
        tns.renew("alice", 1);
        (, , bool expired, ) = tns.getNameInfo("alice");
        assertFalse(expired);
    }

    function test_Transfer() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.transfer("alice", bob);
        (address o, , , ) = tns.getNameInfo("alice");
        assertEq(o, bob);
    }

    function test_TransferUpdatesOwnerLists() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.transfer("alice", bob);
        assertEq(tns.getNameCount(alice), 0);
        assertEq(tns.getNameCount(bob), 1);
    }

    function test_TransferAutoSetsPrimary() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.transfer("alice", bob);
        assertEq(tns.reverseLookup(bob), "alice");
    }

    function test_TransferClearsSenderPrimary() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.transfer("alice", bob);
        vm.expectRevert(TempoNameService.NoPrimaryName.selector);
        tns.reverseLookup(alice);
    }

    function test_TransferCancelsListing() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);
        vm.prank(alice);
        tns.transfer("alice", bob);
        (, , bool active) = tns.getListing("alice");
        assertFalse(active);
    }

    function test_TransferRevertsZeroAddress() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidAddress.selector);
        tns.transfer("alice", address(0));
    }

    function test_TransferRevertsNotOwner() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(bob);
        vm.expectRevert(TempoNameService.NotNameOwner.selector);
        tns.transfer("alice", bob);
    }

    function test_SetPrimaryName() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.register("alice2", 1);
        vm.prank(alice);
        tns.setPrimaryName("alice2");
        assertEq(tns.reverseLookup(alice), "alice2");
    }

    function test_ClearPrimaryName() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.clearPrimaryName();
        vm.expectRevert(TempoNameService.NoPrimaryName.selector);
        tns.reverseLookup(alice);
    }

    function test_SetMetadata() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.setMetadata("alice", "avatar", "https://example.com/pic.png");
        assertEq(tns.getMetadata("alice", "avatar"), "https://example.com/pic.png");
    }

    // ==================== Marketplace ====================

    function test_ListForSale() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);
        (address s, uint256 p, bool a) = tns.getListing("alice");
        assertEq(s, alice);
        assertEq(p, 100 * 1e6);
        assertTrue(a);
        assertEq(tns.getListingCount(), 1);
    }

    function test_ListUpdatePrice() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);
        vm.prank(alice);
        tns.listForSale("alice", 200 * 1e6);
        (, uint256 p, ) = tns.getListing("alice");
        assertEq(p, 200 * 1e6);
        assertEq(tns.getListingCount(), 1);
    }

    function test_CancelListing() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);
        vm.prank(alice);
        tns.cancelListing("alice");
        (, , bool a) = tns.getListing("alice");
        assertFalse(a);
        assertEq(tns.getListingCount(), 0);
    }

    function test_BuyName() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);

        uint256 bobBal = token.balanceOf(bob);
        uint256 aliceBal = token.balanceOf(alice);

        vm.prank(bob);
        tns.buyName("alice");

        (address o, , , ) = tns.getNameInfo("alice");
        assertEq(o, bob);

        uint256 commission = (100 * 1e6 * 250) / 10000;
        assertEq(token.balanceOf(bob), bobBal - 100 * 1e6);
        assertEq(token.balanceOf(alice), aliceBal + 100 * 1e6 - commission);
    }

    function test_BuyNameUpdatesOwnerLists() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);
        vm.prank(bob);
        tns.buyName("alice");
        assertEq(tns.getNameCount(alice), 0);
        assertEq(tns.getNameCount(bob), 1);
    }

    function test_BuyNameRevertsOwnName() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);
        vm.prank(alice);
        vm.expectRevert(TempoNameService.CannotBuyOwnName.selector);
        tns.buyName("alice");
    }

    function test_CleanExpiredListings() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.listForSale("alice", 100 * 1e6);
        vm.prank(bob);
        tns.register("bobname", 1);
        vm.prank(bob);
        tns.listForSale("bobname", 50 * 1e6);

        vm.warp(block.timestamp + 366 days);
        assertEq(tns.getListingCount(), 2);
        tns.cleanExpiredListings(10);
        assertEq(tns.getListingCount(), 0);
    }

    function test_GetListingsPagination() public {
        vm.prank(alice);
        tns.register("name1", 1);
        vm.prank(alice);
        tns.register("name2", 1);
        vm.prank(alice);
        tns.register("name3", 1);
        vm.prank(alice);
        tns.listForSale("name1", 10 * 1e6);
        vm.prank(alice);
        tns.listForSale("name2", 20 * 1e6);
        vm.prank(alice);
        tns.listForSale("name3", 30 * 1e6);

        assertEq(tns.getListings(0, 2).length, 2);
        assertEq(tns.getListings(2, 2).length, 1);
        assertEq(tns.getListings(10, 5).length, 0);
    }

    // ==================== Views ====================

    function test_GetGracePeriodRemaining() public {
        vm.prank(alice);
        tns.register("alice", 1);
        assertEq(tns.getGracePeriodRemaining("alice"), 30 days);

        vm.warp(block.timestamp + 365 days + 15 days);
        assertApproxEqAbs(tns.getGracePeriodRemaining("alice"), 15 days, 1);

        vm.warp(block.timestamp + 16 days);
        assertEq(tns.getGracePeriodRemaining("alice"), 0);
    }

    function test_IsNameAvailable() public {
        assertTrue(tns.isNameAvailable("alice"));
        vm.prank(alice);
        tns.register("alice", 1);
        assertFalse(tns.isNameAvailable("alice"));
    }

    // ==================== Admin ====================

    function test_SetYearlyFee() public {
        tns.setYearlyFee(3, 50 * 1e6);
        assertEq(tns.yearlyFees(3), 50 * 1e6);
    }

    function test_SetMarketplaceFeeRevertsTooHigh() public {
        vm.expectRevert(TempoNameService.FeeAboveMaximum.selector);
        tns.setMarketplaceFee(1001);
    }

    function test_Withdraw() public {
        vm.prank(alice);
        tns.register("alice", 1);
        uint256 bal = token.balanceOf(address(tns));
        assertTrue(bal > 0);
        uint256 before = token.balanceOf(deployer);
        tns.withdraw();
        assertEq(token.balanceOf(deployer) - before, bal);
    }

    // ==================== Complex ====================

    function test_FullLifecycle() public {
        vm.prank(alice);
        tns.register("alice", 1);
        vm.prank(alice);
        tns.setMetadata("alice", "twitter", "@alice");
        vm.prank(alice);
        tns.listForSale("alice", 50 * 1e6);
        vm.prank(bob);
        tns.buyName("alice");
        assertEq(tns.getNameCount(alice), 0);
        assertEq(tns.getNameCount(bob), 1);
        vm.prank(bob);
        tns.transfer("alice", charlie);
        assertEq(tns.getNameCount(bob), 0);
        assertEq(tns.getNameCount(charlie), 1);
    }

    function test_MultipleTransfers() public {
        vm.prank(alice);
        tns.register("name1", 1);
        vm.prank(alice);
        tns.register("name2", 1);
        vm.prank(alice);
        tns.register("name3", 1);
        assertEq(tns.getNameCount(alice), 3);

        vm.prank(alice);
        tns.transfer("name2", bob);
        assertEq(tns.getNameCount(alice), 2);
        assertEq(tns.getNameCount(bob), 1);

        string[] memory an = tns.getNamesOfOwner(alice);
        assertEq(an.length, 2);
    }
}
