import Hero from '../sections/Hero';
import FlashDeals from '../sections/FlashDeals';
import PopularProducts from '../sections/PopularProducts';
import WhyChooseUs from '../sections/WhyChooseUs';
import ShopByCategory from '../sections/ShopByCategory';
import MoreThanPharmacy from '../sections/MoreThanPharmacy';
import Testimonials from '../sections/Testimonials';
import PrescriptionCTA from '../sections/PrescriptionCTA';
import Newsletter from '../sections/Newsletter';
import FeaturedDoctors from '../sections/FeaturedDoctors';
import EmergencyDoctors from '../sections/EmergencyDoctors';

const Home = () => {
  return (
    <div>
      <Hero />
      <FlashDeals />
      <PopularProducts />
      <FeaturedDoctors />
      <WhyChooseUs />
      <ShopByCategory />
      <EmergencyDoctors />
      <MoreThanPharmacy />
      <Testimonials />
      <PrescriptionCTA />
      <Newsletter />
    </div>
  );
};

export default Home;
