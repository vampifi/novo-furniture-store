# Managing Your Products Through a Spreadsheet

## The problem we're solving

Right now, every product on the website has to be entered by hand through the website's admin screen — title, price, photos, everything. With products coming from several suppliers, each sending their own paperwork in their own format, that's slow and easy to get wrong.

## The plan

You'll manage your product catalog from a Google Sheet instead. There's one tab per supplier, and each tab is already laid out the same consistent way — regardless of how different or messy that supplier's own files look.

How it works, step by step:

1. Your supplier sends you their product information, as usual.
2. Our system reads it and fills in that supplier's tab in the Sheet for you.
3. You look through the tab like any normal spreadsheet — nothing to set up.
4. You add the price you want to sell at, and rename anything you'd like to appear differently than the supplier calls it.
5. Within a minute or so, those changes — and any new or updated products — appear live on the website automatically.

## Your part

Each tab has two kinds of columns:

- **Filled in for you** — title, description, photos, and similar details that come straight from the supplier and refresh automatically whenever the supplier updates them.
- **Yours to set** — things like your selling price, or a product name you prefer. Once you set one of these, it's locked in as yours: the system will never quietly overwrite it, even if the supplier changes something else about that product later.

So day to day, you'll mostly be reviewing the sheet, setting prices, and occasionally renaming things — not typing out product descriptions or hunting down photos.

## What stays exactly the same

- Stock levels stay managed entirely in the website's admin system, not the Sheet.
- Orders, customers, and everything else about running the shop is unaffected.

## One important rule

Once this is live, please don't edit a product's details directly in the website's admin screen anymore. The Sheet becomes the master copy — any direct edit in the admin screen will get overwritten the next time the Sheet syncs. If something needs to change, change it in the Sheet.

## What's not built yet

- Exactly how we pull each supplier's files into the system is still being worked out, and may look a little different per supplier.
- A couple of your suppliers send clean, straightforward files, which should be easy to automate first. If a supplier ever sends something much messier — scanned documents, handwritten lists — that one may need extra work later, but it won't hold up the rest of the project.

## Summary

| You do | The system does |
|---|---|
| Review each supplier's tab | Fill in product details automatically from supplier files |
| Set your own prices | Keep your prices exactly as you set them |
| Rename a product if you like | Push every change live on the website within about a minute |
| — | Leave stock levels untouched — still managed in the admin system |
