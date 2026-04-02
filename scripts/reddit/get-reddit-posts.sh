#!/usr/bin/env bash

OUTPUT="./scripts/reddit/reddit_top.txt"
>"$OUTPUT"

SUBS=(
  # Big / mainstream
  funny mildlyinfuriating technology

  # Tech / dev (mid-size)
  programming webdev javascript typescript node
  neovim commandline linux selfhosted homelab

  # Niche dev
  opencodeCLI badUIbattles FullStack ExperiencedDevs

  # Design / product
  web_design userexperience

  # Interests / serendipity
  todayilearned InternetIsBeautiful dataisbeautiful
)

for sub in "${SUBS[@]}"; do
  echo "=== r/$sub ===" >>"$OUTPUT"
  curl -s "https://www.reddit.com/r/${sub}/top.json?t=week&limit=25" \
    -H "User-Agent: currit/0.1 (by /u/this_is_roq)" |
    jq '.data.children[] | {id: .data.id, title: .data.title, score: .data.score, url: .data.url, description: .data.selftext, publishedAt: .data.created, author: .data.author, upvote_ratio: .data.upvote_ratio, gildings: .data.gildings, num_comments: .data.num_comments, all_awardings: .data.all_awardings}' \
      >>"$OUTPUT" 2>&1
  echo "" >>"$OUTPUT"
  sleep 1
done

echo "Done → $OUTPUT"
