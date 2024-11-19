import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const port = 9999;

app.use(cors());
app.use(express.json());

interface Channel {
  id: number;
  name: string;
  views: number;
  followers: number;
  country: string;
}

const channelsDataPath = path.join(__dirname, "..", "index.json");
const channelsJson = fs.readFileSync(channelsDataPath, "utf-8");
const allChannels: Channel[] = JSON.parse(channelsJson);

app.post("/api/channels", (req: Request, res: Response) => {
  const {
    search = "",
    page = 1,
    limit = 16,
    viewsFrom = 0,
    viewsTo = 1000000,
    channelCountry = [],
    sort = {},
  } = req.body;

  let filteredChannels = allChannels;

  if (search) {
    filteredChannels = filteredChannels.filter((channel) =>
      channel.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (channelCountry.length > 0) {
    filteredChannels = filteredChannels.filter((channel) =>
      channelCountry.includes(channel.country)
    );
  }

  if (typeof viewsFrom === "number" && typeof viewsTo === "number") {
    filteredChannels = filteredChannels.filter(
      (channel) => channel.views >= viewsFrom && channel.views <= viewsTo
    );
  }

  if (sort && Object.keys(sort).length > 0) {
    const [sortField] = Object.keys(sort) as (keyof Channel)[];
    const sortOrder = sort[sortField] === -1 ? -1 : 1;

    filteredChannels.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * sortOrder;
      }

      return (aValue > bValue ? 1 : -1) * sortOrder;
    });
  }

  const total = filteredChannels.length;

  const endIndex = page * limit;
  const startIndex = endIndex - limit;
  const paginatedChannels = filteredChannels.slice(startIndex, endIndex);

  res.json({
    data: paginatedChannels,
    total,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
