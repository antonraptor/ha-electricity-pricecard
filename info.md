# Elecricity Price Card

A custom Lovelace card for Home Assistant that displays the current electricity price and today's price curve, styled like the Tibber widget.

## ⚡ Features

- Current electricity price with hourly time window
- Color-coded price bar (green/yellow/red)
- Hourly timeline with current-hour marker
- Responsive design, works in dark mode
- Optional unit switch: `EUR/kWh` or `ct/kWh`

## 🛠 Configuration example

```yaml
type: custom:nordpool-price-card
entity: sensor.nordpool
unit: ct
label: Today's Price
