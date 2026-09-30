### Impact

- Incohérence visible côté client : estimation ≠ prix final.
- Le prix affiché dans `/suivi` ne reflète pas la distance.

### Correctif envisagé

Utiliser le même moteur que `/public/estimate` :

```js
const tariff = await selectServiceTariff({
  serviceId,
  vehicleCategoryId,
  pricingModel: vehicleConfig.pricingModel,
  dimensions: vehicleConfig.tariffDimensions,
});