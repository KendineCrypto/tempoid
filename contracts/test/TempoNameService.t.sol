// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TempoNameService.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock pathUSD for testing (6 decimals like real pathUSD)
contract MockPathUSD is ERC20 {
    constructor() ERC20("pathUSD", "pathUSD") {
        _mint(msg.sender, 1_000_000 * 1e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TempoNameServiceTest is Test {
    TempoNameService public tns;
    MockPathUSD public pathUSD;

    address public deployer = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        pathUSD = new MockPathUSD();
        tns = new TempoNameService(address(pathUSD));

        // Fund test users
        pathUSD.mint(alice, 10_000 * 1e6);
        pathUSD.mint(bob, 10_000 * 1e6);

        // Approve TNS contract
        vm.prank(alice);
        pathUSD.approve(address(tns), type(uint256).max);
        vm.prank(bob);
        pathUSD.approve(address(tns), type(uint256).max);
    }

    // --- Registration Tests ---

    function test_register_5plus_chars() public {
        vm.prank(alice);
        tns.register("fatih", alice, 1);

        assertEq(tns.resolve("fatih"), alice);
    }

    function test_register_4_chars() public {
        vm.prank(alice);
        tns.register("test", alice, 1);

        assertEq(tns.resolve("test"), alice);
    }

    function test_register_3_chars() public {
        vm.prank(alice);
        tns.register("abc", alice, 1);

        assertEq(tns.resolve("abc"), alice);
    }

    function test_register_fees() public {
        // 3 char = 20 pathUSD
        assertEq(tns.getRegistrationFee("abc", 1), 20 * 1e6);
        // 4 char = 5 pathUSD
        assertEq(tns.getRegistrationFee("abcd", 1), 5 * 1e6);
        // 5+ char = 1 pathUSD
        assertEq(tns.getRegistrationFee("abcde", 1), 1 * 1e6);
        // Multi-year
        assertEq(tns.getRegistrationFee("abc", 3), 60 * 1e6);
    }

    function test_register_deducts_payment() public {
        uint256 balBefore = pathUSD.balanceOf(alice);
        vm.prank(alice);
        tns.register("hello", alice, 1);
        uint256 balAfter = pathUSD.balanceOf(alice);

        assertEq(balBefore - balAfter, 1 * 1e6);
    }

    function test_register_emits_event() public {
        vm.prank(alice);
        vm.expectEmit(false, true, false, false);
        emit TempoNameService.NameRegistered("myname", alice, 0);
        tns.register("myname", alice, 1);
    }

    function test_register_sets_primary_name() public {
        vm.prank(alice);
        tns.register("alice", alice, 1);

        assertEq(tns.reverseLookup(alice), "alice");
    }

    function test_register_multi_year() public {
        vm.prank(alice);
        tns.register("multi", alice, 3);

        (, uint256 expiry,,) = tns.getNameInfo("multi");
        assertApproxEqAbs(expiry, block.timestamp + 365 days * 3, 1);
    }

    // --- Validation Tests ---

    function test_revert_invalid_name_too_short() public {
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("ab", alice, 1);
    }

    function test_revert_invalid_name_uppercase() public {
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("Hello", alice, 1);
    }

    function test_revert_invalid_name_special_chars() public {
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("he!lo", alice, 1);
    }

    function test_revert_invalid_name_starts_hyphen() public {
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("-hello", alice, 1);
    }

    function test_revert_invalid_name_ends_hyphen() public {
        vm.prank(alice);
        vm.expectRevert(TempoNameService.InvalidName.selector);
        tns.register("hello-", alice, 1);
    }

    function test_valid_name_with_hyphen() public {
        vm.prank(alice);
        tns.register("my-name", alice, 1);
        assertEq(tns.resolve("my-name"), alice);
    }

    function test_valid_name_with_digits() public {
        vm.prank(alice);
        tns.register("user123", alice, 1);
        assertEq(tns.resolve("user123"), alice);
    }

    // --- Availability Tests ---

    function test_revert_register_taken_name() public {
        vm.prank(alice);
        tns.register("taken", alice, 1);

        vm.prank(bob);
        vm.expectRevert(TempoNameService.NameNotAvailable.selector);
        tns.register("taken", bob, 1);
    }

    function test_register_expired_name_after_grace() public {
        vm.prank(alice);
        tns.register("expiring", alice, 1);

        // Warp past expiry + grace period
        vm.warp(block.timestamp + 365 days + 31 days);

        vm.prank(bob);
        tns.register("expiring", bob, 1);
        assertEq(tns.resolve("expiring"), bob);
    }

    function test_revert_register_during_grace() public {
        vm.prank(alice);
        tns.register("grace", alice, 1);

        // Warp past expiry but within grace period
        vm.warp(block.timestamp + 365 days + 15 days);

        vm.prank(bob);
        vm.expectRevert(TempoNameService.NameNotAvailable.selector);
        tns.register("grace", bob, 1);
    }

    // --- Resolution Tests ---

    function test_revert_resolve_expired() public {
        vm.prank(alice);
        tns.register("expname", alice, 1);

        vm.warp(block.timestamp + 366 days);

        vm.expectRevert(TempoNameService.NameExpired.selector);
        tns.resolve("expname");
    }

    function test_revert_resolve_nonexistent() public {
        vm.expectRevert(TempoNameService.NameExpired.selector);
        tns.resolve("nonexistent");
    }

    // --- Renew Tests ---

    function test_renew_extends_expiry() public {
        vm.prank(alice);
        tns.register("renew-me", alice, 1);

        (, uint256 expiryBefore,,) = tns.getNameInfo("renew-me");

        vm.prank(alice);
        tns.renew("renew-me", 1);

        (, uint256 expiryAfter,,) = tns.getNameInfo("renew-me");
        assertEq(expiryAfter, expiryBefore + 365 days);
    }

    function test_renew_during_grace_period() public {
        vm.prank(alice);
        tns.register("grace-renew", alice, 1);

        vm.warp(block.timestamp + 365 days + 15 days);

        vm.prank(alice);
        tns.renew("grace-renew", 1);

        // Should extend from now since it's past expiry
        (, uint256 expiry,,) = tns.getNameInfo("grace-renew");
        assertApproxEqAbs(expiry, block.timestamp + 365 days, 1);
    }

    // --- Transfer Tests ---

    function test_transfer_name() public {
        vm.prank(alice);
        tns.register("transfer-me", alice, 1);

        vm.prank(alice);
        tns.transfer("transfer-me", bob);

        assertEq(tns.resolve("transfer-me"), bob);
    }

    function test_revert_transfer_not_owner() public {
        vm.prank(alice);
        tns.register("not-mine", alice, 1);

        vm.prank(bob);
        vm.expectRevert(TempoNameService.NotNameOwner.selector);
        tns.transfer("not-mine", bob);
    }

    // --- Primary Name Tests ---

    function test_set_primary_name() public {
        vm.startPrank(alice);
        tns.register("first", alice, 1);
        tns.register("second", alice, 1);
        tns.setPrimaryName("second");
        vm.stopPrank();

        assertEq(tns.reverseLookup(alice), "second");
    }

    // --- Metadata Tests ---

    function test_set_and_get_metadata() public {
        vm.startPrank(alice);
        tns.register("meta", alice, 1);
        tns.setMetadata("meta", "avatar", "https://example.com/avatar.png");
        tns.setMetadata("meta", "twitter", "@alice");
        vm.stopPrank();

        assertEq(tns.getMetadata("meta", "avatar"), "https://example.com/avatar.png");
        assertEq(tns.getMetadata("meta", "twitter"), "@alice");
    }

    // --- Admin Tests ---

    function test_withdraw() public {
        vm.prank(alice);
        tns.register("withdraw-test", alice, 1);

        uint256 balBefore = pathUSD.balanceOf(deployer);
        tns.withdraw();
        uint256 balAfter = pathUSD.balanceOf(deployer);

        assertEq(balAfter - balBefore, 1 * 1e6);
    }

    function test_set_yearly_fee() public {
        tns.setYearlyFee(3, 50 * 1e6);
        assertEq(tns.yearlyFees(3), 50 * 1e6);
    }

    function test_revert_set_fee_not_owner() public {
        vm.prank(alice);
        vm.expectRevert();
        tns.setYearlyFee(3, 50 * 1e18);
    }

    // --- isNameAvailable ---

    function test_is_name_available() public {
        assertTrue(tns.isNameAvailable("available"));

        vm.prank(alice);
        tns.register("available", alice, 1);
        assertFalse(tns.isNameAvailable("available"));

        vm.warp(block.timestamp + 365 days + 31 days);
        assertTrue(tns.isNameAvailable("available"));
    }

    // --- Marketplace Tests ---

    function test_list_for_sale() public {
        vm.startPrank(alice);
        tns.register("forsale", alice, 1);
        tns.listForSale("forsale", 100 * 1e6); // $100
        vm.stopPrank();

        (address seller, uint256 price, bool active) = tns.getListing("forsale");
        assertEq(seller, alice);
        assertEq(price, 100 * 1e6);
        assertTrue(active);
        assertEq(tns.getListingCount(), 1);
    }

    function test_cancel_listing() public {
        vm.startPrank(alice);
        tns.register("cancel-me", alice, 1);
        tns.listForSale("cancel-me", 50 * 1e6);
        tns.cancelListing("cancel-me");
        vm.stopPrank();

        (,, bool active) = tns.getListing("cancel-me");
        assertFalse(active);
        assertEq(tns.getListingCount(), 0);
    }

    function test_buy_name() public {
        // Alice registers and lists
        vm.startPrank(alice);
        tns.register("buyable", alice, 1);
        tns.listForSale("buyable", 100 * 1e6);
        vm.stopPrank();

        // Bob buys
        uint256 bobBalBefore = pathUSD.balanceOf(bob);
        uint256 aliceBalBefore = pathUSD.balanceOf(alice);

        vm.prank(bob);
        tns.buyName("buyable");

        // Verify ownership transferred
        assertEq(tns.resolve("buyable"), bob);

        // Verify payments: 2.5% commission = $2.50
        uint256 commission = (100 * 1e6 * 250) / 10000; // $2.50
        uint256 sellerAmount = 100 * 1e6 - commission; // $97.50

        assertEq(aliceBalBefore + sellerAmount, pathUSD.balanceOf(alice));
        assertEq(bobBalBefore - 100 * 1e6, pathUSD.balanceOf(bob));

        // Listing removed
        (,, bool active) = tns.getListing("buyable");
        assertFalse(active);
        assertEq(tns.getListingCount(), 0);
    }

    function test_revert_buy_own_name() public {
        vm.startPrank(alice);
        tns.register("ownname", alice, 1);
        tns.listForSale("ownname", 50 * 1e6);
        vm.expectRevert(TempoNameService.CannotBuyOwnName.selector);
        tns.buyName("ownname");
        vm.stopPrank();
    }

    function test_revert_buy_not_listed() public {
        vm.prank(alice);
        tns.register("notlisted", alice, 1);

        vm.prank(bob);
        vm.expectRevert(TempoNameService.NotListed.selector);
        tns.buyName("notlisted");
    }

    function test_revert_list_not_owner() public {
        vm.prank(alice);
        tns.register("notmine", alice, 1);

        vm.prank(bob);
        vm.expectRevert(TempoNameService.NotNameOwner.selector);
        tns.listForSale("notmine", 50 * 1e6);
    }

    function test_revert_list_zero_price() public {
        vm.startPrank(alice);
        tns.register("zeroprice", alice, 1);
        vm.expectRevert(TempoNameService.InvalidPrice.selector);
        tns.listForSale("zeroprice", 0);
        vm.stopPrank();
    }

    function test_transfer_cancels_listing() public {
        vm.startPrank(alice);
        tns.register("transferlist", alice, 1);
        tns.listForSale("transferlist", 50 * 1e6);
        tns.transfer("transferlist", bob);
        vm.stopPrank();

        (,, bool active) = tns.getListing("transferlist");
        assertFalse(active);
    }

    function test_set_marketplace_fee() public {
        tns.setMarketplaceFee(500); // 5%
        assertEq(tns.marketplaceFee(), 500);
    }

    function test_revert_marketplace_fee_too_high() public {
        vm.expectRevert();
        tns.setMarketplaceFee(1500); // 15% > max 10%
    }

    function test_get_listed_names() public {
        vm.startPrank(alice);
        tns.register("list1", alice, 1);
        tns.register("list2", alice, 1);
        tns.register("list3", alice, 1);
        tns.listForSale("list1", 10 * 1e6);
        tns.listForSale("list2", 20 * 1e6);
        tns.listForSale("list3", 30 * 1e6);
        vm.stopPrank();

        assertEq(tns.getListingCount(), 3);
        assertEq(tns.getListedNameByIndex(0), "list1");
        assertEq(tns.getListedNameByIndex(1), "list2");
        assertEq(tns.getListedNameByIndex(2), "list3");
    }
}
