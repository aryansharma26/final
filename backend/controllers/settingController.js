import Setting from '../models/Setting.js';

export const getPromoBanner = async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ key: 'promo_banner' });
    if (!setting) {
      setting = await Setting.create({
        key: 'promo_banner',
        value: {
          banner: {
            show: true,
            text: "Flash Offer: Buy 5+ units of any medicine to get up to 20% off!",
            link: "/offers"
          },
          checkoutDiscount: {
            enabled: false,
            minOrderAmount: 1000,
            discountPercentage: 10
          },
          flashDeal: {
            show: true,
            endDate: "2026-08-31 23:59:59",
            headline: "Flash Deals",
            subtext: "Up to 50% off on essential medicines",
            buttonText: "Shop Now",
            buttonLink: "/offers"
          }
        }
      });
    } else {
      let modified = false;
      if (!setting.value.banner) {
        const oldVal = setting.value;
        setting.value = {
          banner: {
            show: oldVal.show !== undefined ? oldVal.show : true,
            text: oldVal.text || "Flash Offer: Buy 5+ units of any medicine to get up to 20% off!",
            link: oldVal.link || "/offers"
          },
          checkoutDiscount: {
            enabled: false,
            minOrderAmount: 1000,
            discountPercentage: 10
          },
          flashDeal: {
            show: true,
            endDate: "2026-08-31 23:59:59",
            headline: "Flash Deals",
            subtext: "Up to 50% off on essential medicines",
            buttonText: "Shop Now",
            buttonLink: "/offers"
          }
        };
        modified = true;
      } else if (!setting.value.flashDeal) {
        setting.value.flashDeal = {
          show: true,
          endDate: "2026-08-31 23:59:59",
          headline: "Flash Deals",
          subtext: "Up to 50% off on essential medicines",
          buttonText: "Shop Now",
          buttonLink: "/offers"
        };
        modified = true;
      }
      if (modified) {
        setting.markModified('value');
        await setting.save();
      }
    }
    res.json({
      success: true,
      banner: setting.value.banner,
      checkoutDiscount: setting.value.checkoutDiscount,
      flashDeal: setting.value.flashDeal
    });
  } catch (error) {
    next(error);
  }
};

export const updatePromoBanner = async (req, res, next) => {
  try {
    const { banner, checkoutDiscount, flashDeal } = req.body;
    let setting = await Setting.findOneAndUpdate(
      { key: 'promo_banner' },
      {
        value: { banner, checkoutDiscount, flashDeal }
      },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      banner: setting.value.banner,
      checkoutDiscount: setting.value.checkoutDiscount,
      flashDeal: setting.value.flashDeal
    });
  } catch (error) {
    next(error);
  }
};
