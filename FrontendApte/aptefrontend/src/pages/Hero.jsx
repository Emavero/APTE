import React from "react";
import Slider from "react-slick";
import img1 from "../assets/images/produits.png";
import img2 from "../assets/images/surveillance.jpg";
import img3 from "../assets/images/devis.jpg";

const ImageList = [
  {
    id: 1,
    img: img1,
    title: "Solutions de vidéosurveillance modernes et fiables",
    description:
      "Découvrez notre gamme complète de caméras de sécurité adaptées à tous vos besoins. Protégez vos locaux, vos proches et vos biens grâce à des technologies avancées offrant une image claire de jour comme de nuit.",
    url: "/products"
  },
  {
    id: 2,
    img: img2,
    title: "Télésurveillance 24/7",
    description:
      "Grâce à notre service de télésurveillance, bénéficiez d'une protection active 24h/24 et 7j/7. En cas d'intrusion ou d'incident, nos experts réagissent immédiatement pour sécuriser vos biens et alerter les forces de l'ordre.",
    url: "/#"
  },
  {
    id: 3,
    img: img3,
    title: "Devis Gratuit et Personnalisé",
    description:
      "Gardez l'esprit tranquille grâce à notre service de télésurveillance. Demandez votre devis gratuit et sur mesure dès maintenant.",
    url: "/quote"
  },
];

const Hero = () => {
  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 800,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    cssEase: "ease-in-out",
    pauseOnHover: false,
    pauseOnFocus: true,
    dotsClass: "slick-dots custom-dots",
  };

  return (
    <div className="relative overflow-hidden min-h-[500px] sm:min-h-[600px] bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center items-center duration-200">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl"></div>
      
      {/* Geometric pattern */}
      <div className="h-[600px] w-[600px] bg-blue-500/10 absolute -top-1/2 right-10 rounded-3xl rotate-45 -z-10"></div>
      
      {/* Hero section */}
      <div className="container mx-auto px-4 pb-12 sm:pb-0 relative z-10">
        <Slider {...settings}>
          {ImageList.map((data) => (
            <div key={data.id} className="outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center py-8 sm:py-12">
                {/* Text content section */}
                <div className="flex flex-col justify-center gap-4 sm:gap-6 text-center sm:text-left order-2 sm:order-1">
                  <h1
                    data-aos="fade-up"
                    data-aos-duration="600"
                    data-aos-once="true"
                    className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
                  >
                    {data.title}
                  </h1>
                  <p
                    data-aos="fade-up"
                    data-aos-duration="600"
                    data-aos-delay="100"
                    className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl"
                  >
                    {data.description}
                  </p>
                  <div
                    data-aos="fade-up"
                    data-aos-duration="600"
                    data-aos-delay="200"
                    className="flex gap-3 sm:gap-4 justify-center sm:justify-start flex-wrap"
                  >
                    <a href={data.url}>
                      <button
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                                 text-white font-medium py-2.5 sm:py-3 px-6 sm:px-8 rounded-full 
                                 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Voir Plus
                      </button>
                    </a>
                  </div>
                </div>
                
                {/* Image section */}
                <div className="order-1 sm:order-2">
                  <div
                    data-aos="zoom-in"
                    data-aos-duration="600"
                    data-aos-once="true"
                    className="relative"
                  >
                    <img
                      src={data.img}
                      alt={data.title}
                      className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px] 
                               object-contain mx-auto drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      <style jsx>{`
        .custom-dots {
          bottom: 20px;
        }
        .custom-dots li button:before {
          font-size: 10px;
          color: #3b82f6;
          opacity: 0.5;
        }
        .custom-dots li.slick-active button:before {
          opacity: 1;
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default Hero;