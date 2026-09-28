const express = require("express");
const { listConversations } = require("../models/conversations");
const { listRecentMessages, listMessages } = require("../models/messages");
const { listLeads } = require("../models/leads");

const router = express.Router();

router.get("/conversations", async (req, res) => {
  const conversations = await listConversations(50);
  res.json(conversations);
});

// /api/messages            -> most recent messages across all conversations
// /api/messages?conversationId=5 -> full transcript of one conversation, in order
router.get("/messages", async (req, res) => {
  const { conversationId } = req.query;
  const messages = conversationId
    ? await listMessages(conversationId, 200)
    : await listRecentMessages(50);
  res.json(messages);
});

router.get("/leads", async (req, res) => {
  const leads = await listLeads(50);
  res.json(leads);
});

module.exports = router;
