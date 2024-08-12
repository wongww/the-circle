import "dotenv/config";
import express from "express";
import { InteractionType, InteractionResponseType } from "discord-interactions";
import { VerifyDiscordRequest, DiscordRequest } from "./utils.js";
import { MongoClient, ServerApiVersion, Timestamp } from "mongodb";
const uri =
  "mongodb+srv://willwongjob:WpB631HLEtgTLB2w@cluster0.fmyesmd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const WEBOOK_URL =
  "https://discord.com/api/webhooks/1272378060745871490/D5nRFOI6ZhA4W2-6_hlLm64ZWeIBdLRWSFZGTWd9tZfYjXMZIRA9B4rkFxTyrH-iF6sE";
// ("https://discord.com/api/webhooks/1259803826416783413/bRFdOnaURZGmn6B31BvvJWQZU7xsdNtn5cOsTUzBJdLQEYfYqqdxc24cDW8sNLUj4ovc");

await client.connect();
const db = client.db("messages");
const collection = db.collection("production");
const changeStream = collection.watch();
changeStream.on("change", async (next) => {
  console.log("Posting a New Post");
  let data = {};
  data["embeds"] = next.fullDocument.embeds;
  await fetch(WEBOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
});

const app = express();
const PORT = process.env.PORT || 3000;
// // Create an express app
// // Get port, or default to 3000
// // Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === "test") {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: "This is a message ",
          embeds: [
            {
              type: "rich",
              title: "This is an embed Title",
              description: "This is description",
              thumbnail: {
                url: "https://m.media-amazon.com/images/I/51ySu55JzAL._AC_SY110_.jpg",
              },
              fields: [
                { name: "ASIN", value: "B07V4GN5YX", inline: true },
                { name: "Discount", value: "94.00%", inline: true },
                { name: "Last Price", value: "$150.03", inline: true },
                { name: "Price Now", value: "$8.47", inline: true },
                { name: "Seller", value: "Koeckritz", inline: true },
                {
                  name: "Quick Links",
                  value:
                    "[Google](https://www.google.com/) | [Netflix](https://www.netflix.com/)",
                  inline: true,
                },
              ],
            },
          ],
          components: [
            {
              type: 1,

              components: [
                {
                  type: 2,
                  label: "Click me!",
                  style: 1,
                  custom_id: "click_one",
                },
              ],
            },
          ],
        },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  await changeStream.close(); // Close change stream
  await client.close(); // Close MongoDB client
  process.exit(0);
};

// Listen for termination signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
