class NordpoolPriceCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.innerHTML = `
      <ha-card>
        <div id="content" style="padding: 12px 16px 8px;"></div>
      </ha-card>
    `;
  }

  set hass(hass) {
    const entityId = this.config.entity || 'sensor.nordpool';
    const stateObj = hass.states[entityId];
    if (!stateObj) {
      this.querySelector('#content').innerHTML = 'Entität nicht gefunden.';
      return;
    }

    const price = parseFloat(stateObj.state).toFixed(2);
    const unit = stateObj.attributes.unit_of_measurement || '€/kWh';
    const now = new Date();
    const currentHour = now.getHours();
    const rawToday = stateObj.attributes.raw_today;
    const currentSlot = rawToday?.[currentHour];

    const timeLabel = currentSlot
      ? `${new Date(currentSlot.start).getHours().toString().padStart(2, '0')}:00 – ${new Date(currentSlot.end).getHours().toString().padStart(2, '0')}:00`
      : '';

    const prices = rawToday.map(x => x.value);
    const avg = prices.reduce((sum, v) => sum + v, 0) / prices.length;
    const minPrice = Math.min(...prices);

    // Farbkodierung
    rawToday.forEach(slot => {
      if (slot.value === minPrice) {
        slot.cssColor = '#2e7d32';      // dunkelgrün für günstigste Stunde(n)
        slot.isLowestPrice = true;       // Markierung für günstigste Stunde(n)
      } else if (slot.value < avg * 0.9) {
        slot.cssColor = '#4caf50';       // normal grün
      } else if (slot.value > avg * 1.1) {
        slot.cssColor = '#f44336';       // rot
      } else {
        slot.cssColor = '#ffc107';       // neutral (amber)
      }
    });

    const timeline = rawToday.map((slot, i) => {
      const color = slot.cssColor;
      const isNow = i === currentHour;
      const nextColor = i < rawToday.length - 1 ? rawToday[i + 1].cssColor : color;
      const isPast = i < currentHour;
      const opacity = isPast ? 0.4 : 1;
      const currentMinute = now.getMinutes();
      const positionPercent = currentMinute / 60 * 100;

      return `
        <div style="
          position: relative;
          flex: 1;
          height: 8px;
          background: ${color !== nextColor 
            ? `linear-gradient(to right, ${color} 0%, ${color} 85%, ${nextColor} 100%)`
            : color};
          opacity: ${opacity};
          transition: opacity 0.3s ease;
        ">
          ${slot.isLowestPrice ? `
            <div style="
              position: absolute;
              top: -20px; /* Positionierung über der Timeline */
              left: 50%; /* Zentriert über dem Block */
              transform: translateX(-50%);
              font-size: 10px; /* Schriftgröße für den Preis */
              color: var(--secondary-text-color);
              opacity: 1; /* Voll sichtbar */
              white-space: nowrap;
            ">${slot.value.toFixed(2)} ${unit}</div>
          ` : ''}
          ${isNow ? `
            <div style="
              position: absolute;
              top: -4px;
              left: ${positionPercent}%;
              width: 2px;
              height: 16px;
              background: white;
              transform: translateX(-50%);
              box-shadow: 0 0 4px rgba(255,255,255,0.5);
            "></div>
          ` : ''}
        </div>
      `;
    }).join('');

    const hourLabels = Array.from({ length: 24 }, (_, i) => `
      <div style="
        flex: 1; 
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      ">
        <div style="
          width: 3px;
          height: 3px;
          background-color: var(--secondary-text-color);
          border-radius: 50%;
          opacity: 0.5;
          margin-bottom: 2px;
        "></div>
        ${i % 3 === 0 ? `
          <span style="
            font-size: 11px;
            color: var(--secondary-text-color);
            opacity: 0.7;
          ">${String(i).padStart(2, '0')}</span>
        ` : ''}
      </div>
    `).join('');

    this.querySelector('#content').innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
        <div style="font-size: 12px; color: var(--secondary-text-color); opacity: 0.7;">${timeLabel}</div>
        <div style="font-size: 12px; color: var(--secondary-text-color); opacity: 0.7;">Heutiger Preis</div>
      </div>
      <div style="font-size: 20px; font-weight: 500; line-height: 1; margin: 2px 0;">${price} ${unit}</div>
      <div style="margin-top: 6px;">
        <div style="display: flex; gap: 0; overflow: hidden; border-radius: 4px;">${timeline}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 10px; color: var(--secondary-text-color); opacity: 0.7;">
          ${hourLabels}
        </div>
      </div>
    `;
  }

  static getConfigElement() {
    const element = document.createElement('nordpool-price-card-editor');
    return element;
  }

  static getStubConfig() {
    return {
      entity: 'sensor.nordpool',
      unit: 'EUR', // Default unit
    };
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('nordpool-price-card', NordpoolPriceCard);

class NordpoolPriceCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.innerHTML = `
      <div class="card-config">
        <paper-dropdown-menu label="Sensor auswählen" class="dropdown">
          <paper-listbox slot="dropdown-content" selected="0">
            ${Object.keys(hass.states)
              .filter(entity => entity.startsWith('sensor.nordpool'))
              .map(entity => `<paper-item>${entity}</paper-item>`).join('')}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-dropdown-menu label="Einheit auswählen" class="dropdown">
          <paper-listbox slot="dropdown-content" selected="0">
            <paper-item>EUR</paper-item>
            <paper-item>Cent</paper-item>
          </paper-listbox>
        </paper-dropdown-menu>
      </div>
    `;
  }

  get value() {
    return this.config;
  }

  set value(config) {
    this.config = config;
  }
}

customElements.define('nordpool-price-card-editor', NordpoolPriceCardEditor);
