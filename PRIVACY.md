# Privacy Policy for TheWCAG Color Blindness Simulator

**Last Updated:** January 2025

## Overview

TheWCAG Color Blindness Simulator ("the Extension") is committed to protecting your privacy. This privacy policy explains how the Extension handles your data.

## Data Collection

### What We Collect

The Extension collects and stores the following data **locally on your device only**:

1. **Filter Preferences**: Your preferred color blindness filter type and severity settings
2. **User Settings**: Preferences such as dark mode, auto-apply on load, and notification settings
3. **Filter History**: Recently used filter configurations (optional)
4. **Per-site Settings**: If enabled, filter preferences for specific websites

### What We Do NOT Collect

- **No Personal Information**: We do not collect names, emails, addresses, or any personally identifiable information
- **No Analytics**: We do not track your usage patterns or behavior
- **No Third-Party Data Sharing**: We do not share any data with third parties
- **No Remote Servers**: All data stays on your device; we do not send data to any external servers
- **No Browsing History**: We do not access or store your browsing history
- **No Cookies**: We do not use cookies or tracking technologies
- **No Page Content**: We do not read, store, or transmit any webpage content

## Data Storage

All data is stored using Chrome's `storage.local` API, which means:

- Data is stored locally on your computer
- Data is encrypted by Chrome
- Data is never transmitted over the network
- Data can be cleared at any time through the extension's Settings panel

## Permissions Explained

The Extension requests the following permissions:

| Permission | Why We Need It |
|------------|----------------|
| `activeTab` | To apply color blindness filters to the current webpage when you enable simulation |
| `storage` | To save your filter preferences and settings locally on your device |
| `scripting` | To inject the color filter into webpages when you activate simulation |
| `host_permissions: <all_urls>` | To allow the simulator to work on any website you visit |

### Why "All URLs" Permission?

The `<all_urls>` host permission is required because:

1. **Filter Application**: Needs to inject SVG filters and apply CSS to simulate color blindness
2. **Content Script**: Needs to run on any webpage to provide the simulation feature

**Important**: Even with this permission, the Extension:
- Only activates when YOU enable the filter
- Does not automatically read or store any webpage content
- Does not track which websites you visit
- Only modifies how colors are displayed (visual effect only)

## Data Retention

- **Preferences**: Retained until you reset them or uninstall the extension
- **Filter History**: Retained until you clear it manually in Settings
- **Per-site Settings**: Retained until you remove them or uninstall

## Your Rights

You have full control over your data:

1. **View Settings**: See your preferences in the Settings tab
2. **Export Data**: Export all data as JSON through Settings
3. **Clear History**: Clear filter history through Settings
4. **Reset Defaults**: Reset all settings to defaults
5. **Uninstall**: Removing the extension deletes all associated data

## Security

- All data is stored locally using Chrome's secure storage APIs
- No data is transmitted to external servers
- The extension does not have access to sensitive browser data like passwords or payment information

## Children's Privacy

This Extension does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date above. Continued use of the Extension after changes constitutes acceptance of the updated policy.

## Contact

If you have questions about this privacy policy or the Extension, please:

- Visit: [https://thewcag.com](https://thewcag.com)
- GitHub Issues: [https://github.com/WOLFIEEEE/ColorBlindness-Extension/issues](https://github.com/WOLFIEEEE/ColorBlindness-Extension/issues)

---

**Summary**: TheWCAG Color Blindness Simulator stores all data locally on your device, does not collect personal information, does not use analytics or tracking, and does not share any data with third parties.
