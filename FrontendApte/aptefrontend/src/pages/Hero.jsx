import React from "react";
import Slider from "react-slick";
import Image1 from "../assets//hero/cameras.png";
import Image2 from "../assets/hero/shopping.png";
import Image3 from "../assets/hero/sale.png";

const ImageList = [
  {
    id: 1,
    img: Image1,
    title: "Solutions de vidéosurveillance modernes et fiables",
    description:
      "Découvrez notre gamme complète de caméras de sécurité adaptées à tous vos besoins. Protégez vos locaux, vos proches et vos biens grâce à des technologies avancées offrant une image claire de jour comme de nuit.",
    url: "/#"
  },
  {
    id: 2,
    img: Image1,
    title: "Télésurveillance",
    description:
      "Grâce à notre service de télésurveillance, bénéficiez d’une protection active 24h/24 et 7j/7. En cas d’intrusion ou d’incident, nos experts réagissent immédiatement pour sécuriser vos biens et alerter les forces de l’ordre. La sérénité n’a jamais été aussi simple !",
    url: "/#"
    },
  {
    id: 3,
    img: Image1,
    title: "votre tarif",
    description:
      "Gardez l’esprit tranquille grâce à notre service de télésurveillance. Demandez votre devis gratuit et sur mesure dès maintenant.",
    url: "/#"},
];

const Hero = ({ handleOrderPopup }) => {
  var settings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 800,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    cssEase: "ease-in-out",
    pauseOnHover: false,
    pauseOnFocus: true,
  };

  return (
    <div className="relative overflow-hidden min-h-[550px] sm:min-h-[500px] bg-[#DCDBEA] text-gray-800 flex justify-center items-center dark:bg-gray-950 dark:text-white duration-200 ">
      {/* background pattern */}
      <div className="h-[700px] w-[700px] bg-primary/40 absolute -top-1/2 right-1 rounded-3xl rotate-45 -z[9]"></div>
      {/* hero section */}
      <div className="container pb-8 sm:pb-0">
        <Slider {...settings}>
          {ImageList.map((data) => (
            <div key={data.id} className="outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* text content section */}
                <div className="flex flex-col justify-center gap-4 pt-12 sm:pt-0 text-center sm:text-left order-2 sm:order-1 relative z-10">
                  <h1
                    data-aos="zoom-out"
                    data-aos-duration="500"
                    data-aos-once="true"
                    className="text-5xl sm:text-6xl lg:text-7xl font-bold"
                  >
                    {data.title}
                  </h1>
                  <p
                    data-aos="fade-up"
                    data-aos-duration="500"
                    data-aos-delay="100"
                    className="text-sm"
                  >
                    {data.description}
                  </p>
                  <div
                    data-aos="fade-up"
                    data-aos-duration="500"
                    data-aos-delay="300"
                  >
                   <a href={data.url}>
                    <button
                      onClick={handleOrderPopup}
                      className="bg-gradient-to-r from-primary to-secondary hover:scale-105 duration-200 text-white py-2 px-4 rounded-full"
                    >
                      voir plus
                    </button>
                     </a>
                  </div>
                </div>
                {/* image section */}
                <div className="order-1 sm:order-2">
                  <div
                    data-aos="zoom-in"
                    data-aos-once="true"
                    className="relative z-10"
                  >
                    <img
                      src={data.img}
                      alt=""
                      className="w-[300px] h-[300px] sm:h-[450px] sm:w-[450px] sm:scale-105 lg:scale-120 object-contain mx-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Hero;
