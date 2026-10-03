Feature: Current seasonal challenge invitation registration
  Scenario: Invitation is required only for configured campaigns
    Given only the visible Central Thailand campaign requires an invitation
    When a signed-in climber joins without a code
    Then registration is rejected without deleting accounts or climb logs
    And another campaign can still be joined without a code
  Scenario: Atomic single-account redemption and safe retries
    Given an unpredictable single-use code bound to a campaign
    When its intended account redeems it
    Then the code and registration are committed together
    And the same account can retry without consuming another code
    And a second account cannot redeem the code
  Scenario: Direct writes and old clients cannot bypass the gate
    When an authenticated client inserts an enrollment or prize claim directly
    Then a gated campaign write is denied
  Scenario: Protected scoped reset
    Given the approved exact three-registration fingerprint still matches
    When the coordinated reset is reviewed and run
    Then exact rows are archived server-side before deletion
    And all other enrollments, accounts, climbs and awards remain unchanged
