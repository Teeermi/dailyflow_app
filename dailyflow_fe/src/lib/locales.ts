export const locales = {
  // ─── Landing ───────────────────────────────────────────────────────────────
  landing: {
    heading: "Your daily standup, automated",
    subheading: "Connect Asana. Select tasks. Ship standups.",
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    heading: "Today's Standup",
    subheading: "Select the tasks to include in your standup update",
    generateButton: (count: number) => `Generate Standup (${count})`,
    allProjects: "All projects",
    loadError: "Failed to load tasks. Please refresh or reconnect to Asana.",
    sections: {
      completedYesterday: "Completed Yesterday",
      inProgressYesterday: "In Progress Yesterday",
      activeToday: "Active Today",
    },
  },

  // ─── Daily / New ───────────────────────────────────────────────────────────
  dailyNew: {
    generating: "Generating your standup with AI…",
    generateError: "Failed to generate standup. Please try again.",
  },

  // ─── Daily / View-Edit ─────────────────────────────────────────────────────
  dailyDetail: {
    heading: (date: string) => `Standup — ${date}`,
    taskCount: (n: number) => `${n} tasks included`,
    notFound: "Daily not found.",
    backButton: "← All Standups",
    contentPlaceholder: "Your standup content…",
    saveButton: "Save Changes",
    savingButton: "Saving…",
    copyButton: "Copy",
    postToSlackButton: "Post to Slack",
    postingButton: "Posting…",
    webhookMissingTitle: "Configure Slack webhook in Settings first",
    toast: {
      copied: "Copied to clipboard!",
      saved: "Standup saved!",
      saveError: "Failed to save standup",
      slackSuccess: "Posted to Slack!",
      slackError: "Failed to post to Slack",
    },
  },

  // ─── Dailies / History ─────────────────────────────────────────────────────
  dailies: {
    heading: "Standup History",
    subheading: "All your saved daily standups",
    newButton: "+ New Standup",
    empty: "No standups yet.",
    emptyHint: "Go to the",
    emptyHintLink: "Dashboard",
    emptyHintSuffix: "to generate your first one.",
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: {
    heading: "Settings",
    subheading: "Configure integrations for your account",
    slackSection: "Slack Integration",
    slackDescription:
      "Paste your Slack Incoming Webhook URL to enable posting standups directly to your channel.",
    slackHowTo: "How to create a webhook",
    slackPlaceholder: "https://hooks.slack.com/services/...",
    saveButton: "Save Webhook URL",
    savingButton: "Saving…",
    toast: {
      saved: "Slack webhook saved!",
      saveError: "Failed to save webhook URL",
    },
  },

  // ─── Navbar ─────────────────────────────────────────────────────────────────
  navbar: {
    brand: "DailyFlow",
    dashboard: "Dashboard",
    history: "History",
    settings: "Settings",
    toggleDarkMode: "Toggle dark mode",
    logout: "Logout",
    toast: {
      logoutError: "Logout failed",
    },
  },

  // ─── Components ─────────────────────────────────────────────────────────────
  asanaButton: {
    imgAlt: "Asana",
    label: "Continue with Asana",
  },

  taskSection: {
    noTasks: "No tasks found",
  },

  taskCard: {
    due: (date: string) => `Due: ${date}`,
  },
} as const
