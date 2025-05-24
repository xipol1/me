// const mongoose = require('mongoose'); // Removed if not directly used elsewhere
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe with secret key
const paypal = require('@paypal/checkout-server-sdk');

const User = require('../models/User');
const Channel = require('../models/Channel'); // Assuming Channel model will be used later
const Transaction = require('../models/Transaction');

// Configure PayPal client
// Environment: PayPal.core.SandboxEnvironment or PayPal.core.LiveEnvironment
const paypalEnvironment = process.env.PAYPAL_MODE === 'live'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID_SANDBOX || process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET_SANDBOX || process.env.PAYPAL_CLIENT_SECRET); // Fallback to non-sandbox if specific sandbox vars not set
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

/**
 * Clase para el sistema de comisiones y billetera para creadores
 */
class SistemaComisiones {
  constructor(/* stripeAPI, paypalAPI, */ cryptoAPI) { // Stripe and PayPal clients are now configured globally
    // this.stripeAPI = stripeAPI; // No longer needed as instance var if using global stripe client
    // this.paypalAPI = paypalAPI; // No longer needed as instance var if using global paypalClient
    this.cryptoAPI = cryptoAPI; // Assuming cryptoAPI is still passed or configured elsewhere
    this.comisionPorcentaje = 10; // Comisión predeterminada del 10%
    this.comisionMinima = 1; // Comisión mínima en USD
  }

  /**
   * Establece el porcentaje de comisión de la plataforma
   * @param {number} porcentaje - Porcentaje de comisión (0-100)
   */
  setComisionPorcentaje(porcentaje) {
    if (porcentaje < 0 || porcentaje > 100) {
      throw new Error('El porcentaje de comisión debe estar entre 0 y 100');
    }
    this.comisionPorcentaje = porcentaje;
  }

  /**
   * Establece la comisión mínima de la plataforma
   * @param {number} minima - Comisión mínima en USD
   */
  setComisionMinima(minima) {
    if (minima < 0) {
      throw new Error('La comisión mínima no puede ser negativa');
    }
    this.comisionMinima = minima;
  }

  /**
   * Calcula la comisión para una transacción
   * @param {number} monto - Monto de la transacción
   * @param {string} moneda - Moneda de la transacción (USD, EUR, etc.)
   * @param {string} tipoCanal - Tipo de canal (telegram, whatsapp, instagram, discord)
   * @param {string} tipoAnuncio - Tipo de anuncio (post, story, mención, etc.)
   * @returns {Object} Detalles de la comisión
   */
  calcularComision(monto, moneda = 'USD', tipoCanal, tipoAnuncio) {
    // Aplicar ajustes según el tipo de canal y anuncio
    let porcentajeAjustado = this.comisionPorcentaje;
    
    // Ajustar comisión según el tipo de canal
    switch (tipoCanal) {
      case 'telegram':
        porcentajeAjustado -= 1; // 1% menos para Telegram
        break;
      case 'instagram':
        porcentajeAjustado += 2; // 2% más para Instagram
        break;
      case 'discord':
        porcentajeAjustado -= 2; // 2% menos para Discord
        break;
      default:
        // Sin ajuste para otros canales
        break;
    }
    
    // Ajustar comisión según el tipo de anuncio
    switch (tipoAnuncio) {
      case 'post':
        // Sin ajuste para posts estándar
        break;
      case 'story':
        porcentajeAjustado -= 1; // 1% menos para stories
        break;
      case 'mencion':
        porcentajeAjustado += 1; // 1% más para menciones
        break;
      case 'destacado':
        porcentajeAjustado += 3; // 3% más para anuncios destacados
        break;
      default:
        // Sin ajuste para otros tipos
        break;
    }
    
    // Asegurar que el porcentaje esté en un rango válido
    porcentajeAjustado = Math.max(1, Math.min(porcentajeAjustado, 30));
    
    // Calcular comisión
    let comision = (monto * porcentajeAjustado) / 100;
    
    // Aplicar comisión mínima
    comision = Math.max(comision, this.comisionMinima);
    
    // Asegurar que la comisión no supere el monto total
    comision = Math.min(comision, monto * 0.5); // Máximo 50% del monto
    
    // Calcular monto neto para el creador
    const montoNeto = monto - comision;
    
    return {
      montoTotal: monto,
      moneda,
      comisionPorcentaje: porcentajeAjustado,
      comisionMonto: comision,
      montoNeto,
      tipoCanal,
      tipoAnuncio
    };
  }

  /**
   * Procesa un pago y distribuye los fondos entre la plataforma y el creador
   * @param {Object} pagoData - Datos del pago
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async procesarPago(pagoData) {
    try {
      const {
        metodo, // 'stripe', 'paypal', 'crypto'
        monto,
        moneda,
        tipoCanal, // This might come from the channel object
        tipoAnuncio, // This might come from ad object or rate object
        anuncianteId,
        creadorId,
        adId, // Assuming adId is passed
        detallesPago
      } = pagoData;

      const anunciante = await User.findById(anuncianteId);
      const creador = await User.findById(creadorId);
      // const ad = await Ad.findById(adId); // Assuming Ad model exists and is required
      // const channel = await Channel.findById(ad.channelId); // Assuming ad has channelId

      if (!anunciante || !creador) {
        throw new Error('Anunciante or Creador not found.');
      }
      // if (!ad || !channel) throw new Error('Ad or Channel not found.');
      
      // For now, tipoCanal and tipoAnuncio are passed directly.
      // In a real scenario, these might be derived from ad/channel objects.
      const comisionInfo = this.calcularComision(monto, moneda, tipoCanal, tipoAnuncio);
      
      const transaccionId = uuidv4(); // Still useful for external reference if needed
      
      let resultadoPago;
      // Switch for payment methods (procesarPagoStripe, etc.) remains the same
      // Ensure these sub-methods now return enough info for the Transaction doc
      // e.g., { gatewayId: '...', gatewayStatus: '...', processorFee: ... }
      switch (metodo) {
        case 'stripe':
          resultadoPago = await this.procesarPagoStripe(detallesPago, comisionInfo, transaccionId);
          break;
        case 'paypal':
          resultadoPago = await this.procesarPagoPayPal(detallesPago, comisionInfo, transaccionId);
          break;
        case 'crypto':
          resultadoPago = await this.procesarPagoCrypto(detallesPago, comisionInfo, transaccionId);
          break;
        default:
          throw new Error(`Método de pago no soportado: ${metodo}`);
      }

      if (resultadoPago.estado !== 'succeeded' && resultadoPago.estado !== 'completed' && resultadoPago.estado !== 'confirmado' && resultadoPago.status !== 'succeeded' /*Stripe uses status*/) {
          // Payment failed, create a failed transaction record
          const failedTx = new Transaction({
              type: 'ad_purchase',
              userId: anuncianteId,
              relatedUser: creadorId,
              adId: adId,
              // channelId: channel._id,
              description: `Failed payment attempt for Ad ${adId || 'N/A'}`,
              amount: comisionInfo.montoTotal,
              currency: comisionInfo.moneda,
              platformFee: 0,
              processorFee: resultadoPago.processorFee || 0,
              netAmount: 0, // No money moved to creator
              status: 'failed',
              paymentMethod: metodo,
              paymentGatewayId: resultadoPago.id || transaccionId,
              gatewayResponse: resultadoPago,
              metadata: { transaccionIdOriginal: transaccionId }
          });
          await failedTx.save();
          throw new Error(`Payment failed with status: ${resultadoPago.estado || resultadoPago.status}`);
      }

      // Create successful transaction record
      const transaccion = new Transaction({
        type: 'ad_purchase',
        userId: anuncianteId, // The one paying
        relatedUser: creadorId, // The one receiving (before fees)
        adId: adId,
        // channelId: channel._id, 
        description: `Payment for Ad ${adId || 'N/A'} via ${metodo}`,
        amount: comisionInfo.montoTotal,
        currency: comisionInfo.moneda,
        platformFee: comisionInfo.comisionMonto,
        processorFee: resultadoPago.processorFee || 0, // Assume processorFee is returned by payment methods
        netAmount: comisionInfo.montoNeto,
        status: 'succeeded',
        paymentMethod: metodo,
        paymentGatewayId: resultadoPago.id || transaccionId, // ID from payment gateway
        gatewayResponse: resultadoPago, // Store some response for auditing
        metadata: { transaccionIdOriginal: transaccionId }
      });
      await transaccion.save();
      
      // Update creator's wallet
      let creatorWallet = creador.wallet.balances.find(b => b.currency === moneda);
      if (creatorWallet) {
        creatorWallet.amount += comisionInfo.montoNeto;
      } else {
        creador.wallet.balances.push({ currency: moneda, amount: comisionInfo.montoNeto });
      }
      // Ensure default currency is set if not present
      if (!creador.wallet.defaultCurrency) {
          creador.wallet.defaultCurrency = 'USD'; // Or some other logic
      }
      await creador.save();
      
      return {
        transaction: transaccion,
        comisionInfo,
        resultadoPago
      };
    } catch (error) {
      console.error('Error al procesar pago:', error.message, error.stack);
      // throw error; // Re-throwing can be good, but ensure it's handled by caller
      // For now, let's return an error structure
      return { error: true, message: error.message, details: error.stack };
    }
  }

  /**
   * Procesa un pago con Stripe
   * @param {Object} detallesPago - Detalles del pago con Stripe
   * @param {Object} comisionInfo - Información de la comisión
   * @param {string} transaccionId - ID de la transacción
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async procesarPagoStripe(detallesPago, comisionInfo, transaccionId) {
    try {
      const { paymentMethodId, customerId, description, return_url } = detallesPago; // return_url for 3DS
      const amountInCents = Math.round(comisionInfo.montoTotal * 100);

      // Example: Create and confirm a PaymentIntent
      const paymentIntentParams = {
        amount: amountInCents,
        currency: comisionInfo.moneda.toLowerCase(),
        payment_method: paymentMethodId,
        customer: customerId, // Optional, if you have Stripe Customer objects
        description: description || `Pago por anuncio en ${comisionInfo.tipoCanal}`,
        metadata: {
          transaccion_plataforma_id: transaccionId,
          tipoCanal: comisionInfo.tipoCanal,
          tipoAnuncio: comisionInfo.tipoAnuncio,
        },
        confirm: true, // Attempt to confirm immediately
        // return_url: return_url || 'your_platform_redirect_url_for_3ds', // Required for SCA
      };
      
      // For payments requiring user action (e.g. 3D Secure)
      if (return_url) {
          paymentIntentParams.return_url = return_url;
          // if payment_method is not provided, Stripe might create one or use a saved one.
          // if payment_method is provided, 'confirm: true' might fail if it needs 3DS.
          // A more robust flow involves creating, then confirming on client, then handling server-side.
          // For simplicity here, we assume direct server-side confirmation for non-SCA or if SCA handled by client.
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
      
      // Simplified fee calculation (Stripe fees are complex and vary)
      // This is a very rough placeholder for processorFee.
      const calculatedStripeFee = Math.round(amountInCents * 0.029 + 30) / 100; // e.g., 2.9% + $0.30

      return {
        id: paymentIntent.id,
        status: paymentIntent.status, // e.g., 'succeeded', 'requires_action', 'processing'
        client_secret: paymentIntent.client_secret, // if requires_action
        processorFee: calculatedStripeFee, // Placeholder
        metodo: 'stripe'
      };
    } catch (error) {
      console.error('Error al procesar pago con Stripe:', error.message, error.stack);
      return { id: transaccionId, status: 'failed', error: error.message, processorFee: 0, metodo: 'stripe' };
    }
  }

  /**
   * Procesa un pago con PayPal
   * @param {Object} detallesPago - Detalles del pago con PayPal
   * @param {Object} comisionInfo - Información de la comisión
   * @param {string} transaccionId - ID de la transacción
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async procesarPagoPayPal(detallesPago, comisionInfo, transaccionId) {
    try {
      const { orderIdToCapture, /* or other details like payerId if creating order here */ } = detallesPago;
      let orderID = orderIdToCapture;
      let createdOrder = null;

      if (!orderID) {
          // Create order if no orderID is provided to capture
          const request = new paypal.orders.OrdersCreateRequest();
          request.prefer("return=representation");
          request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
              reference_id: transaccionId,
              description: `Pago por anuncio en ${comisionInfo.tipoCanal}`,
              custom_id: transaccionId,
              amount: {
                currency_code: comisionInfo.moneda.toUpperCase(),
                value: comisionInfo.montoTotal.toFixed(2)
              }
            }],
            // application_context: { // Optional: for redirect URLs if needed
            //   return_url: 'your_platform_return_url',
            //   cancel_url: 'your_platform_cancel_url'
            // }
          });
          createdOrder = await paypalClient.execute(request);
          orderID = createdOrder.result.id;
      }
      
      if (!orderID) {
          throw new Error('PayPal Order ID not available for capture.');
      }

      // Capture the order
      const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
      captureRequest.requestBody({}); // Can be empty for capture
      const capture = await paypalClient.execute(captureRequest);
      const captureData = capture.result;

      // Simplified fee calculation (PayPal fees vary)
      // This is a very rough placeholder.
      const calculatedPayPalFee = (comisionInfo.montoTotal * 0.0349 + 0.49).toFixed(2);

      return {
        id: captureData.id, // This is the capture ID, or use orderID if more relevant
        status: captureData.status, // e.g., 'COMPLETED', 'PENDING'
        processorFee: parseFloat(calculatedPayPalFee), // Placeholder
        metodo: 'paypal',
        orderData: createdOrder ? createdOrder.result : null // Include created order data if applicable
      };
    } catch (error) {
      console.error('Error al procesar pago con PayPal:', error.message, error.response ? error.response.data : '', error.stack);
      return { id: transaccionId, status: 'failed', error: error.message, processorFee: 0, metodo: 'paypal' };
    }
  }

  /**
   * Procesa un pago con criptomonedas
   * @param {Object} detallesPago - Detalles del pago con criptomonedas
   * @param {Object} comisionInfo - Información de la comisión
   * @param {string} transaccionId - ID de la transacción
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async procesarPagoCrypto(detallesPago, comisionInfo, transaccionId) {
    try {
      const {
        fromAddress,
        privateKey,
        toAddress,
        amount,
        txHash
      } = detallesPago;
      
      // Si ya tenemos un hash de transacción, verificarlo
      if (txHash) {
        const receipt = await this.cryptoAPI.getTransactionReceipt(txHash);
        return {
          id: txHash,
          estado: receipt.status ? 'confirmado' : 'fallido',
          metodo: 'crypto',
          blockNumber: receipt.blockNumber
        };
      }
      
      // Crear una nueva transacción
      const receipt = await this.cryptoAPI.sendTransaction({
        fromAddress,
        privateKey,
        toAddress,
        amount: amount || comisionInfo.montoTotal, // Monto en ETH
        gasLimit: 21000
      });
      
      return {
        id: receipt.transactionHash,
        estado: receipt.status ? 'confirmado' : 'fallido',
        metodo: 'crypto',
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error al procesar pago con criptomonedas:', error.message);
      throw error;
    }
  }

  /**
   * Actualiza la billetera de un creador
   * @param {string} creadorId - ID del creador
   * @param {number} monto - Monto a añadir
   * @param {string} moneda - Moneda del monto
   * @returns {Promise<Object>} Billetera actualizada
   */
  async actualizarBilleteraCreador(creadorId, monto, moneda, operationType = 'credit') { // operationType 'credit' or 'debit'
    try {
      const creador = await User.findById(creadorId);
      if (!creador) {
        throw new Error('Creator not found for wallet update.');
      }
      
      let balanceEntry = creador.wallet.balances.find(b => b.currency === moneda);
      if (balanceEntry) {
        if (operationType === 'credit') {
          balanceEntry.amount += monto;
        } else if (operationType === 'debit') {
          balanceEntry.amount -= monto;
          if (balanceEntry.amount < 0) throw new Error('Insufficient funds for debit.');
        }
      } else {
        if (operationType === 'credit') {
          creador.wallet.balances.push({ currency: moneda, amount: monto });
        } else { // debit on non-existing currency balance
          throw new Error(`No balance found for currency ${moneda} to debit.`);
        }
      }
      if (!creador.wallet.defaultCurrency) {
          creador.wallet.defaultCurrency = 'USD';
      }
      await creador.save();
      console.log(`Billetera del creador ${creadorId} actualizada: ${operationType === 'credit' ? '+' : '-'}${monto} ${moneda}`);
      return creador.wallet;
    } catch (error) {
      console.error('Error al actualizar billetera del creador:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el balance de la billetera de un creador
   * @param {string} creadorId - ID del creador
   * @returns {Promise<Object>} Balance de la billetera
   */
  async obtenerBalanceBilletera(creadorId) {
    try {
      const creador = await User.findById(creadorId);
      if (!creador) {
        throw new Error('Creator not found for balance inquiry.');
      }
      console.log(`Obteniendo balance de billetera del creador ${creadorId}`);
      return {
        creadorId,
        balances: creador.wallet.balances,
        defaultCurrency: creador.wallet.defaultCurrency,
        fechaActualizacion: creador.updatedAt // Or a dedicated wallet update timestamp if added
      };
    } catch (error) {
      console.error('Error al obtener balance de billetera:', error.message);
      throw error;
    }
  }

  /**
   * Solicita un retiro de fondos de la billetera
   * @param {Object} retiroData - Datos del retiro
   * @returns {Promise<Object>} Resultado del retiro
   */
  async solicitarRetiro(retiroData) {
    try {
      const {
        creadorId,
        metodo, // 'stripe', 'paypal', 'crypto', 'banco'
        monto,
        moneda,
        detallesRetiro
      } = retiroData;

      const creador = await User.findById(creadorId);
      if (!creador) {
        throw new Error('Creator not found for withdrawal request.');
      }

      const balanceMoneda = creador.wallet.balances.find(b => b.moneda === moneda);
      if (!balanceMoneda || balanceMoneda.amount < monto) {
        throw new Error(`Balance insuficiente para el retiro: ${balanceMoneda ? balanceMoneda.amount : 0} ${moneda}`);
      }
      
      const retiroId = uuidv4(); // For external reference / metadata
      let resultadoRetiro;
      
      // Switch for procesarRetiroStripe, etc. remains same
      // Ensure these sub-methods return enough info for the Transaction doc
      switch (metodo) {
        case 'stripe':
          resultadoRetiro = await this.procesarRetiroStripe(detallesRetiro, monto, moneda, retiroId);
          break;
        case 'paypal':
          resultadoRetiro = await this.procesarRetiroPayPal(detallesRetiro, monto, moneda, retiroId);
          break;
        case 'crypto':
          resultadoRetiro = await this.procesarRetiroCrypto(detallesRetiro, monto, moneda, retiroId);
          break;
        case 'banco':
          resultadoRetiro = await this.procesarRetiroBanco(detallesRetiro, monto, moneda, retiroId);
          break;
        default:
          throw new Error(`Método de retiro no soportado: ${metodo}`);
      }

      if (resultadoRetiro.estado !== 'succeeded' && resultadoRetiro.estado !== 'completed' && resultadoRetiro.estado !== 'confirmado' && resultadoRetiro.status !== 'succeeded' && resultadoRetiro.estado !== 'procesando' /* banco can be procesando */) {
          // Withdrawal processing failed with payment gateway
          const failedTx = new Transaction({
              type: 'withdrawal',
              userId: creadorId,
              description: `Failed withdrawal attempt via ${metodo}`,
              amount: monto,
              currency: moneda,
              platformFee: 0, // Fees might apply on withdrawals, add if needed
              processorFee: resultadoRetiro.processorFee || 0,
              netAmount: monto, // Net amount requested by user
              status: 'failed',
              paymentMethod: metodo,
              paymentGatewayId: resultadoRetiro.id || retiroId,
              gatewayResponse: resultadoRetiro,
              metadata: { retiroIdOriginal: retiroId }
          });
          await failedTx.save();
          throw new Error(`Withdrawal processing failed with status: ${resultadoRetiro.estado || resultadoRetiro.status}`);
      }

      // Create transaction record for withdrawal
      const transaccionRetiro = new Transaction({
        type: 'withdrawal',
        userId: creadorId,
        description: `Withdrawal via ${metodo}`,
        amount: monto, // The amount requested by user
        currency: moneda,
        platformFee: 0, // Assuming no platform fee on withdrawal for now
        processorFee: resultadoRetiro.processorFee || 0, // Fee charged by payment processor
        netAmount: monto, // The amount the user should receive (or monto - processorFee if user bears it)
        status: resultadoRetiro.estado === 'procesando' ? 'processing' : 'succeeded', // some transfers are not instant
        paymentMethod: metodo,
        paymentGatewayId: resultadoRetiro.id || retiroId,
        gatewayResponse: resultadoRetiro,
        metadata: { retiroIdOriginal: retiroId }
      });
      await transaccionRetiro.save();
      
      // Update creator's wallet (debit)
      balanceMoneda.amount -= monto;
      await creador.save();
      
      return {
        transaction: transaccionRetiro,
        resultadoRetiro
      };
    } catch (error) {
      console.error('Error al solicitar retiro:', error.message, error.stack);
      // throw error;
      return { error: true, message: error.message, details: error.stack };
    }
  }

  /**
   * Procesa un retiro con Stripe
   * @param {Object} detallesRetiro - Detalles del retiro con Stripe
   * @param {number} monto - Monto a retirar
   * @param {string} moneda - Moneda del retiro
   * @param {string} retiroId - ID del retiro
   * @returns {Promise<Object>} Resultado del retiro
   */
  async procesarRetiroStripe(detallesRetiro, monto, moneda, retiroId) {
    try {
      const { accountId } = detallesRetiro; // Stripe Connect account ID of the creator
      if (!accountId) throw new Error('Stripe account ID is required for withdrawal.');

      const amountInCents = Math.round(monto * 100);

      // Create a Transfer to the Connect account
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: moneda.toLowerCase(),
        destination: accountId,
        description: `Retiro de fondos - Plataforma ID: ${retiroId}`,
        metadata: { retiro_plataforma_id: retiroId }
      });
      
      // Placeholder for fees. Stripe Transfer fees are usually on the platform.
      const processorFee = 0; // Or calculate if applicable

      return {
        id: transfer.id,
        status: transfer.status || 'succeeded', // Stripe transfer status, 'succeeded' is a guess for direct transfers
        processorFee: processorFee,
        metodo: 'stripe'
      };
    } catch (error) {
      console.error('Error al procesar retiro con Stripe:', error.message, error.stack);
      return { id: retiroId, status: 'failed', error: error.message, processorFee: 0, metodo: 'stripe' };
    }
  }

  /**
   * Procesa un retiro con PayPal
   * @param {Object} detallesRetiro - Detalles del retiro con PayPal
   * @param {number} monto - Monto a retirar
   * @param {string} moneda - Moneda del retiro
   * @param {string} retiroId - ID del retiro
   * @returns {Promise<Object>} Resultado del retiro
   */
  async procesarRetiroPayPal(detallesRetiro, monto, moneda, retiroId) {
    try {
      const { email } = detallesRetiro; // PayPal email of the creator
      if (!email) throw new Error('PayPal email is required for withdrawal.');

      const request = new paypal.payouts.PayoutsPostRequest();
      request.requestBody({
        sender_batch_header: {
          sender_batch_id: `Payout_${retiroId}_${Date.now()}`,
          email_subject: 'Has recibido un pago de [TuPlataforma]',
          email_message: `Has recibido un pago de ${monto} ${moneda} de [TuPlataforma]. ID de Retiro: ${retiroId}`
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: {
            value: monto.toFixed(2),
            currency: moneda.toUpperCase()
          },
          note: `Retiro de fondos - ID: ${retiroId}`,
          sender_item_id: `item_${retiroId}_${Date.now()}`,
          receiver: email
        }]
      });

      const response = await paypalClient.execute(request);
      const batchHeader = response.result.batch_header;

      // Placeholder for fees. PayPal Payout fees vary.
      const processorFee = (monto * 0.02).toFixed(2); // Example 2% fee

      return {
        id: batchHeader.payout_batch_id,
        status: batchHeader.batch_status, // e.g., PENDING, SUCCESS, UNCLAIMED
        processorFee: parseFloat(processorFee),
        metodo: 'paypal'
      };
    } catch (error) {
      console.error('Error al procesar retiro con PayPal:', error.message, error.response ? error.response.data : '', error.stack);
      return { id: retiroId, status: 'failed', error: error.message, processorFee: 0, metodo: 'paypal' };
    }
  }

  /**
   * Procesa un retiro con criptomonedas
   * @param {Object} detallesRetiro - Detalles del retiro con criptomonedas
   * @param {number} monto - Monto a retirar
   * @param {string} moneda - Moneda del retiro
   * @param {string} retiroId - ID del retiro
   * @returns {Promise<Object>} Resultado del retiro
   */
  async procesarRetiroCrypto(detallesRetiro, monto, moneda, retiroId) {
    try {
      const {
        address // Dirección de la billetera del creador
      } = detallesRetiro;
      
    // CRITICAL SECURITY WARNING:
    // The direct use of `process.env.CRYPTO_PLATFORM_PRIVATE_KEY` below is EXTREMELY DANGEROUS
    // and makes the platform's crypto funds highly vulnerable to theft if this environment
    // variable is compromised or exposed.
    //
    // DO NOT USE THIS IN PRODUCTION.
    //
    // Recommended Solutions:
    // 1. Use a dedicated secrets management service (e.g., HashiCorp Vault, AWS Secrets Manager,
    //    Google Secret Manager) to store the private key securely.
    // 2. Implement a separate, hardened microservice or module that has exclusive,
    //    controlled access to the private key (e.g., through a vault) and only exposes
    //    signing functionality to this application. This application should then request
    //    signing operations from that isolated service.
    // 3. Utilize a custodial wallet solution or a smart contract-based treasury that
    //    abstracts direct private key handling away from this application.
    //
    // This current implementation is a placeholder and poses a severe security risk.
    // It should be redesigned before any real funds are handled.
      // Obtener la cuenta de la plataforma para enviar los fondos
      const platformAccount = {
        address: process.env.CRYPTO_PLATFORM_ADDRESS,
        privateKey: process.env.CRYPTO_PLATFORM_PRIVATE_KEY
      };
      
      // Enviar transacción
      const receipt = await this.cryptoAPI.sendTransaction({
        fromAddress: platformAccount.address,
        privateKey: platformAccount.privateKey,
        toAddress: address,
        amount: monto, // Monto en ETH
        gasLimit: 21000
      });
      
      return {
        id: receipt.transactionHash,
        estado: receipt.status ? 'confirmado' : 'fallido',
        metodo: 'crypto',
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error al procesar retiro con criptomonedas:', error.message);
      throw error;
    }
  }

  /**
   * Procesa un retiro a cuenta bancaria
   * @param {Object} detallesRetiro - Detalles del retiro a banco
   * @param {number} monto - Monto a retirar
   * @param {string} moneda - Moneda del retiro
   * @param {string} retiroId - ID del retiro
   * @returns {Promise<Object>} Resultado del retiro
   */
  async procesarRetiroBanco(detallesRetiro, monto, moneda, retiroId) {
    try {
      const {
        nombreBanco,
        numeroCuenta,
        titularCuenta,
        codigoSwift
      } = detallesRetiro;
      
      // Aquí se implementaría la lógica para procesar transferencias bancarias
      // Por ahora, simulamos el proceso
      console.log(`Procesando retiro bancario: ${monto} ${moneda} a ${titularCuenta} - ${numeroCuenta} (${nombreBanco})`);
      
      return {
        id: `BANCO_${retiroId}`,
        estado: 'procesando',
        metodo: 'banco',
        fechaEstimadaAcreditacion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 días después
      };
    } catch (error) {
      console.error('Error al procesar retiro bancario:', error.message);
      throw error;
    }
  }
}

module.exports = SistemaComisiones;
