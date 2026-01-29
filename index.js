const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_PUBLIC_KEY = '6607a04756d8ac4ded681a0b11b88c2a6b63f9e8714c0f66e71d882c03bee62f';
const PRESTASHOP_URL = 'https://mafranchise.com/api';
const PRESTASHOP_API_KEY = 'TU2Y9Z5DBUJBKU266XF7SS9WVUZYPWMF';

app.post('/interactions', verifyKeyMiddleware(DISCORD_PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name } = interaction.data;

    if (name === 'stock') {
      const productId = interaction.data.options[0].value;

      try {
        const auth = Buffer.from(PRESTASHOP_API_KEY + ':').toString('base64');
        const response = await fetch(
          `${PRESTASHOP_URL}/stock_availables?filter[id_product]=${productId}&output_format=JSON`,
          {
            headers: {
              'Authorization': `Basic ${auth}`
            }
          }
        );

        const data = await response.json();
        const stocks = data.stock_availables || [];

        if (stocks.length === 0) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `❌ Produit #${productId} introuvable`
            }
          });
        }

        const totalStock = stocks.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `📦 **Stock produit #${productId}**\n✅ Quantité disponible : **${totalStock}** unités`
          }
        });

      } catch (error) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `❌ Erreur : ${error.message}`
          }
        });
      }
    }

    if (name === 'commandes') {
      try {
        const today = new Date().toISOString().split('T')[0];
        const auth = Buffer.from(PRESTASHOP_API_KEY + ':').toString('base64');
        const response = await fetch(
          `${PRESTASHOP_URL}/orders?filter[date_add]=[${today},${today}]&display=full&output_format=JSON`,
          {
            headers: {
              'Authorization': `Basic ${auth}`
            }
          }
        );

        const data = await response.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `📋 Aucune commande aujourd'hui (${today})`
            }
          });
        }

        const totalCA = orders.reduce((sum, o) => sum + parseFloat(o.total_paid || 0), 0);
        const ordersList = orders.slice(0, 10).map(o =>
          `• Commande #${o.id} - ${parseFloat(o.total_paid).toFixed(2)}€`
        ).join('\n');

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `📋 **Commandes du jour** (${today})\n\n${ordersList}\n\n💰 **Total : ${totalCA.toFixed(2)}€** (${orders.length} commande${orders.length > 1 ? 's' : ''})`
          }
        });

      } catch (error) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `❌ Erreur : ${error.message}`
          }
        });
      }
    }
  }

  res.status(400).send('Unknown interaction type');
});

app.get('/', (req, res) => {
  res.send('Bot Discord PrestaShop is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
