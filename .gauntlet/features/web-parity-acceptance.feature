Feature: Hosted feed parity acceptance
  As a climber using the hosted Peen web app
  I want feed sharing, community content, achievements, refresh, and inbox links to behave predictably
  So that the web feed remains useful when compared with the mobile experience

  Background:
    Given I am signed in to the hosted Peen web app
    And the app has loaded the Feed screen

  Scenario: An owner shares their send with a rich caption
    Given the feed contains my public send with a route and location
    When I choose the share action on my send
    Then the operating system share sheet opens with a caption containing "@getpeen"
    And the caption contains "#PeenSend" and a link containing "/app/feed?climb="
    And the link identifies my send

  Scenario: Rich share falls back to copying the full caption
    Given the browser does not provide an operating system share sheet
    And the feed contains my public send
    When I choose Share from my send's More menu
    Then the clipboard receives the caption and deep link together
    And I see a confirmation that says "Caption + link copied"

  Scenario: Canceling rich share leaves the feed usable
    Given the operating system share sheet is available
    When I open rich share for my send and cancel the share sheet
    Then I remain on the feed
    And I do not see an error toast

  Scenario: Copy link remains a URL-only action
    Given the feed contains my send and another climber's send
    When I choose Copy link from my send's More menu
    Then the clipboard receives only the send URL
    When I choose the share action on the other climber's send
    Then the clipboard receives only that send URL
    And no rich caption is created for the other climber's send

  Scenario: The owner shares from the send detail overlay
    Given I open my send's detail overlay
    When I choose the overlay share action
    Then the same rich share caption and deep link rules are used

  Scenario: Community reels appear when the service returns reels
    Given the community reels service returns at least one reel
    When the Feed screen finishes loading
    Then the feed header shows "Community reels"
    And each returned reel has a visible tile
    When I choose a reel tile
    Then its Instagram page opens in a separate browser tab or window

  Scenario: Community reels stay hidden when there is no reel data
    Given the community reels service returns no reels
    When the Feed screen finishes loading
    Then no empty reels carousel is shown
    And the normal feed remains available

  Scenario: Featured achievements appear on feed cards and profile peek
    Given a feed send has a featured achievement
    And its climber has a public profile with achievements
    When I view the send card
    Then the featured achievement badge is visible on the card
    When I open that climber's profile peek
    Then the featured achievement and achievements strip are visible

  Scenario: Achievement and feed content handle empty or unavailable data
    Given a public profile has no achievements or the achievement request fails
    When I open the profile peek
    Then the profile remains usable
    And no broken achievement tile is displayed

  Scenario: Refresh reloads the feed without a full page reload
    Given the Feed screen is showing loaded content
    When I choose the refresh control
    Then feed loading indicators appear while data is reloaded
    And the feed updates in place
    And I remain on the Feed screen
    And I see a "Feed refreshed" confirmation after a successful refresh

  Scenario: Feed loading uses native-like skeletons
    Given the feed request is still loading
    When I view the Feed screen
    Then three feed card skeletons are shown before the first page arrives

  Scenario Outline: Inbox notification opens a sensible destination
    Given the inbox contains a notification of kind "<kind>" targeting entity type "<entity_type>" with id "<entity>"
    When I choose that notification
    Then the app attempts to mark the notification read
    And I am taken to "<destination>" or shown a clear message explaining the supported app destination
    And the inbox closes

    Examples:
      | kind                  | entity_type        | entity    | destination                     |
      | route                 | route              | route-1   | the route detail overlay        |
      | climb                 | climb              | climb-1   | the send detail overlay         |
      | crew_invite           | crew_invite        | invite-1  | the Crew screen                 |
      | belay_verify_request  | belay_verification | request-1 | my Profile screen with guidance |
      | belay_verify_result   | belay_verification | request-1 | my Profile screen with guidance |
      | follow                | user               | user-1    | the sender's profile peek       |
      | like                  | climb              | climb-1   | the send detail overlay         |
      | sendit                | climb              | climb-1   | the send detail overlay         |
      | comment               | climb              | climb-1   | the send detail overlay         |
      | climb_request         | climb_request      | request-1 | the sender's profile peek       |

  Scenario: An unsupported inbox notification explains what to do
    Given the inbox contains a notification type the web app cannot open
    When I choose that notification
    Then the app attempts to mark the notification read
    And I see a clear message telling me where the action is supported
    And the inbox closes without leaving me on a blank state
