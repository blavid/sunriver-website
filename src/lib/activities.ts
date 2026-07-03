export type Activity = {
  id: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  distance?: string;
  season?: string;
  tip?: string;
  /** Official or informational link */
  url?: string;
  /** Swap in affiliate URLs here when ready — takes priority over url when set */
  affiliateUrl?: string;
};

export type ActivitySection = {
  id: string;
  title: string;
  subtitle: string;
  activities: Activity[];
};

export const activitySections: ActivitySection[] = [
  {
    id: "dining",
    title: "Dining",
    subtitle:
      "From grab-and-go bakery runs to date-night bistros — Sunriver and Bend deliver.",
    activities: [
      {
        id: "south-bend-bistro",
        name: "South Bend Bistro",
        description:
          "Sunriver's go-to for a special night out. Pacific Northwest plates — scallops, king salmon, truffle ragù — in an intimate Village setting with a strong local wine list.",
        image: "/images/photos/activities/Dining/SouthBendBistro.jpeg",
        imageAlt: "Fine dining table setting with wine glasses",
        distance: "5 min by bike to the Village",
        season: "Year-round",
        tip: "Reserve ahead in summer and holiday weeks.",
        url: "https://www.southbendbistro.com/",
      },
      { 
        id: "sunriver-brewing",
        name: "Sunriver Brewing Co.",
        description:
          "Award-winning craft brewery with a family-friendly pub, patio, and menu built for après-adventure hunger. A Sunriver institution after biking, hiking, or skiing.",
        image: "/images/photos/activities/Dining/SunriverBrewing.jpeg",
        imageAlt: "Craft beer flight on a wooden table",
        distance: "5 min by bike to the Village",
        season: "Year-round",
        tip: "Fuzztail and Paddy's Irish Lager are guest favorites.",
        url: "https://www.sunriverbrewingcompany.com/",
      },
      {
        id: "hot-lava-bakery",
        name: "Hot Lava Bakery",
        description:
          "The only bakery in Sunriver — oversized glazed doughnuts, bagels, quiche, and breakfast burritos. Lines form on summer mornings for good reason.",
        image: "/images/photos/activities/Dining/HotLavaBakery.jpeg",
        imageAlt: "Fresh pastries and croissants in a bakery display",
        distance: "5 min by bike to the Village",
        season: "Year-round",
        tip: "Arrive before 9:30 AM in peak season.",
        url: "https://www.hotlavabakery.com/",
      },
      {
        id: "sparrow-bakery",
        name: "Sparrow Bakery",
        description:
          "Bend's cult-favorite bakery famous for the ocean roll — a buttery, salted-sweet masterpiece. Also excellent savory pastries and coffee.",
        image: "/images/photos/activities/DiningSparrowBakery.jpg",
        imageAlt: "Fresh baked goods on a counter",
        distance: "20 min drive to Bend",
        season: "Year-round",
        tip: "Ocean rolls sell out — go early or pre-order.",
        url: "https://www.thesparrowbakery.net/restaurant/",
      },
      {
        id: "rio-sol",
        name: "Rio Sol at Sunriver Marina",
        description:
          "Latin American cuisine and craft cocktails on the Deschutes River at the Sunriver Marina. Scenic sunset dinners with water views.",
        image: "/images/photos/activities/Dining/RioSol.jpg",
        imageAlt: "Outdoor dining with river views at sunset",
        distance: "8 min drive",
        season: "Seasonal — check hours",
        tip: "Request a patio table for golden-hour views.",
        url: "https://www.riosollatinkitchen.com/",
      },
      {
        id: "el-caporal",
        name: "El Caporal",
        description:
          "Authentic Mexican cuisine with lively margaritas and a warm Village atmosphere.",
        image: "/images/photos/activities/Dining/ElCaporal.jpg",
        imageAlt: "Mexican dish with tortillas and salsa",
        distance: "5 min by bike to the Village",
        season: "Year-round",
        tip: "Try the carne asada tacos and house margaritas.",
        url: "https://www.elcaporalco.com/",
      },
      {
        id: "blondies-pizza",
        name: "Blondie's Pizza",
        description:
          "Wood-fired, family-friendly pizza in Sunriver — great for groups and takeout.",
        image: "/images/photos/activities/Dining/BlondiesPizza.jpeg",
        imageAlt: "Wood-fired pizza fresh from the oven",
        distance: "5–10 min by bike",
        season: "Year-round",
        tip: "Order ahead on busy summer nights.",
        url: "https://blondiespizzasunriver.com/",
      },
      {
        id: "village-bar-grill",
        name: "Village Bar & Grill",
        description:
          "Casual American fare, cocktails, and a friendly local vibe right in the Village.",
        image: "/images/photos/activities/VillageBar&Grill.avif",
        imageAlt: "Bar and grill dining area with rustic decor",
        distance: "Walkable in the Village",
        season: "Year-round",
        tip: "Good spot for families and late-night bites.",
        url: "https://www.sunrivervbag.com/",
      },
      {
        id: "the-wallow",
        name: "The Wallow",
        description:
          "Contemporary Pacific Northwest dishes with seasonal ingredients and a refined yet relaxed dining room.",
        image: "/images/photos/activities/Dining/TheWallow.jpg",
        imageAlt: "Elegant plated entree on a table",
        distance: "20–25 min drive to Bend",
        season: "Year-round",
        tip: "Excellent for date nights and special occasions.",
        url: "https://www.thewallowgrill.com/",
      },
      {
        id: "campfire-cucina",
        name: "Campfire Cucina",
        description:
          "Italian-inspired cooking with wood-fired flavors — pizza, pasta, and shareable small plates.",
        image: "/images/photos/activities/CampfireCucina.jpg",
        imageAlt: "Pasta and Italian dishes on a wooden table",
        distance: "10–20 min drive",
        season: "Year-round",
        tip: "Great for groups — try a few small plates to share.",
        url: "https://www.pizzasunriver.com/",
      },
      {
        id: "century-common-taps-and-trucks",
        name: "Century Common Taps & Trucks",
        description:
          "A rotating lineup of food trucks paired with local craft taps — casual outdoor dining and community vibes.",
        image: "/images/photos/activities/CenturyCommonsTapsTrucks.webp",
        imageAlt: "Outdoor food trucks and beer taps",
        distance: "20–25 min drive to Bend",
        season: "Seasonal — check schedule",
        tip: "Check the events calendar for truck lineups and tap takeovers.",
        url: "https://www.centurycommonstaps.com/",
      },
      {
        id: "josie-ks-deli",
        name: "Josie K's Deli",
        description:
          "Casual deli fare with hearty sandwiches, salads, and quick grab-and-go options for day trips.",
        image: "/images/photos/activities/Dining/JosieKsDeli.jpg",
        imageAlt: "Deli sandwich on a plate",
        distance: "10–20 min drive",
        season: "Year-round",
        tip: "Perfect for picnic boxes and quick lunches.",
        url: "https://www.josiek.com/",
      },
    ],
  },
  {
    id: "hiking",
    title: "Hiking",
    subtitle:
      "Volcanic peaks, alpine lakes, waterfall canyons, and high-desert trails — all within day-trip range.",
    activities: [
      {
        id: "benham-falls",
        name: "Benham Falls",
        description:
          "The largest waterfall on the upper Deschutes River, thundering through a rugged lava canyon. Mostly flat, family-friendly, and beautiful year-round.",
        image:
          "/images/photos/activities/Hiking/BenhamFalls.jpeg",
        imageAlt: "Waterfall cascading through a forest canyon",
        distance: "10 min drive from Sunriver",
        season: "Best in spring for peak flow",
        tip: "Combine with a bike ride on the Deschutes River Trail.",
      },
      {
        id: "smith-rock",
        name: "Smith Rock State Park",
        description:
          "Oregon's most iconic crags — golden cliffs rising above the Crooked River. Misery Ridge is the classic loop with jaw-dropping views. Also world-class rock climbing.",
        image:
          "/images/photos/activities/Hiking/smith-rock-vert.jpg",
        imageAlt: "Dramatic rocky cliffs and river canyon",
        distance: "45 min drive north",
        season: "Spring and fall are ideal",
        tip: "Start early — the trail gets hot and crowded by midday in summer.",
        url: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=36",
      },
      {
        id: "green-lakes",
        name: "Green Lakes Trail",
        description:
          "A Central Oregon classic — hike through wildflower meadows and lava fields to impossibly blue alpine lakes beneath the South Sister volcano.",
        image:
          "/images/photos/activities/Hiking/Green-Lakes-Trail.webp",
        imageAlt: "Alpine lake surrounded by mountain peaks",
        distance: "45 min drive to trailhead",
        season: "July through September",
        tip: "Arrive before 7 AM on weekends — the trailhead fills fast.",
      },
      {
        id: "tam-mcarthur-rim",
        name: "Tam McArthur Rim",
        description:
          "A relatively short hike with enormous payoff — stand on the rim of a glacial cirque with views of Broken Top, the Three Sisters, and endless Cascades.",
        image:
          "/images/photos/activities/Hiking/TamMcArthurRimTrail.jpg",
        imageAlt: "Mountain ridge trail with panoramic views",
        distance: "40 min drive",
        season: "Late June through October",
        tip: "Wildflowers peak in July. Bring layers — it's exposed at the top.",
      },
      {
        id: "tumalo-falls",
        name: "Tumalo Falls",
        description:
          "A 97-foot waterfall just outside Bend with a scenic loop trail above the falls. Easy access and one of the most photographed spots in Central Oregon.",
        image:
          "/images/photos/activities/Hiking/TumaloFalls.jpeg",
        imageAlt: "Tall waterfall in a lush forest",
        distance: "35 min drive",
        season: "Year-round — check road access in winter",
        tip: "The upper trail gives you views most visitors miss.",
      },
      {
        id: "lava-butte",
        name: "Lava Butte & Lava Lands",
        description:
          "Climb a cinder cone for 360° views of volcanic landscape, then walk the paved Lava Lands loop through jagged black lava fields. Great for all ages.",
        image:
          "/images/photos/activities/Hiking/LavaButte.jpg",
        imageAlt: "Lava Butte cinder cone with volcanic landscape",
        distance: "15 min drive",
        season: "Year-round",
        tip: "Timed entry may be required in summer — check recreation.gov.",
        url: "https://www.nps.gov/deso/planyourvisit/lava-lands-visitor-center.htm",
      },
    ],
  },
  {
    id: "swimming",
    title: "Swimming",
    subtitle:
      "From the SHARC water park to alpine lakes — cool off after a Central Oregon adventure.",
    activities: [
      {
        id: "sharc",
        name: "SHARC Aquatic Center",
        description:
          "Sunriver's premier aquatic center — waterslides, lazy river, lap pool, surf simulator, rock climbing wall, and fitness center. Your stay includes 8 guest passes.",
        image:
          "/images/photos/activities/Swimming/SunriverSHARC.avif",
        imageAlt: "Outdoor swimming pool with water slides",
        distance: "5 min drive",
        season: "Year-round (indoor/outdoor)",
        tip: "Passes are in the kitchen drawer at the house.",
        url: "https://www.sunriversharc.com/",
      },
      {
        id: "elk-lake",
        name: "Elk Lake",
        description:
          "A gorgeous alpine lake at 4,900 ft with sandy beaches, paddle rentals, and Mt. Bachelor as a backdrop. The water is cold but refreshing on hot summer days.",
        image:
          "/images/photos/activities/Swimming/ElkLakeResort.jpeg",
        imageAlt: "Clear alpine lake with pine trees and mountains",
        distance: "30 min drive",
        season: "June through September",
        tip: "Grab lunch at the Elk Lake Resort cafe on the shore.",
      },
      {
        id: "sparks-lake",
        name: "Sparks Lake",
        description:
          "One of the most photographed lakes in Oregon — shallow, crystal-clear water with South Sister reflected on calm mornings. Wade in from the shore or bring a float.",
        image:
          "/images/photos/activities/Swimming/SparksLake.jpg",
        imageAlt: "Serene lake reflecting mountain peaks at sunrise",
        distance: "35 min drive",
        season: "July through September",
        tip: "Sunrise here is magical — bring a camera.",
      },
      {
        id: "paulina-lake",
        name: "Paulina Lake",
        description:
          "A deep volcanic lake inside the Newberry Caldera with hot springs on the far shore, boat rentals, and excellent fishing. Two lakes in one caldera — East Lake is nearby.",
        image:
          "/images/photos/activities/Swimming/PaulinaLake.jpg",
        imageAlt: "Mountain lake with forest shoreline",
        distance: "45 min drive",
        season: "June through October",
        tip: "Hike to Paulina Peak for a caldera overview before swimming.",
        url: "https://www.fs.usda.gov/recarea/deschutes/recarea/?recid=71762",
      },
      {
        id: "devils-lake",
        name: "Devil's Lake",
        description:
          "A pristine alpine lake tucked in a glacial cirque with stunning mountain views and excellent swimming. Crystal-clear water and a scenic trail loop make it a must-visit destination.",
        image:
          "/images/photos/activities/Swimming/DevilsLake.jpg",
        imageAlt: "Alpine lake surrounded by forested mountains",
        distance: "40 min drive",
        season: "July through September",
        tip: "Arrive early — parking fills quickly on weekends.",
      },
      {
        id: "eaglewood-pool",
        name: "Eaglewood Community Pool",
        description:
          "Steps from the back deck — a seasonal community pool exclusive to Eaglewood guests and residents. Perfect for a quick dip without leaving the neighborhood.",
        image:
          "/images/photos/activities/Swimming/EaglewoodPool.jpg",
        imageAlt: "Community swimming pool on a sunny day",
        distance: "2 min walk",
        season: "Summer only",
        tip: "Check the HOA board by the pool for seasonal hours.",
      },
    ],
  },
  {
    id: "river-floats",
    title: "River Floats & Rafting",
    subtitle:
          "The Deschutes River is Central Oregon's summer playground — from lazy floats to whitewater thrills.",
    activities: [
      {
        id: "deschutes-float",
        name: "Deschutes River Float",
        description:
          "The quintessential Central Oregon summer experience — float the gentle Deschutes on a tube or kayak through pine forests. Popular routes run from Sunriver toward Bend.",
        image:
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
        imageAlt: "Kayaking on a calm river through forest",
        distance: "Launch points within Sunriver",
        season: "June through August",
        tip: "Rent tubes at the Sunriver Marina or in Bend. Bring sunscreen and a dry bag.",
      },
      {
        id: "sun-country-tours",
        name: "Sun Country Tours Whitewater",
        description:
          "Guided rafting trips on the Deschutes — from mellow scenic floats to Class III rapids through Big Eddy. Professional guides, all gear included.",
        image:
          "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&q=80",
        imageAlt: "Whitewater raft navigating river rapids",
        distance: "Pickup in Bend or Sunriver area",
        season: "May through September",
        tip: "Book the Big Eddy Thriller for families with teens.",
        url: "https://www.suncountrytours.com/",
      },
      {
        id: "big-eddy",
        name: "Big Eddy Thriller",
        description:
          "The Deschutes' most famous whitewater stretch — Class III rapids through a scenic canyon. Half-day guided trips suitable for adventurous beginners.",
        image:
          "https://images.unsplash.com/photo-1544551763-77ef69d985c0?w=800&q=80",
        imageAlt: "Raft going through whitewater rapids",
        distance: "30 min drive to put-in",
        season: "May through August",
        tip: "Wear a swimsuit under the wetsuit — you'll get soaked.",
        url: "https://www.suncountrytours.com/rafting/big-eddy-thriller/",
      },
      {
        id: "standup-paddle-deschtues",
        name: "Deschutes River SUP & Kayak",
        description:
          "Calmer sections of the Deschutes near Sunriver are perfect for stand-up paddleboarding and kayak exploring. Several outfitters rent gear by the half-day.",
        image:
          "https://images.unsplash.com/photo-1530866495565-9d6d0c4e8b4e?w=800&q=80",
        imageAlt: "Stand-up paddleboarding on a calm lake",
        distance: "Sunriver Marina",
        season: "June through September",
        tip: "Morning water is glassy — best for SUP.",
      },
    ],
  },
  {
    id: "skiing-snowboarding",
    title: "Skiing & Snowboarding",
    subtitle:
      "World-class Cascades skiing just up the road — and cross-country trails when the snow flies.",
    activities: [
      {
        id: "mt-bachelor",
        name: "Mt. Bachelor Ski Resort",
        description:
          "3,365 acres of lift-served terrain on a single volcano — groomers, bowls, glades, and a legendary spring skiing season that runs into May. 24 minutes from the house.",
        image:
          "https://images.unsplash.com/photo-1551524556-7dd5cb516f31?w=800&q=80",
        imageAlt: "Skier carving down a snowy mountain slope",
        distance: "24 min drive",
        season: "November through May",
        tip: "Buy lift tickets online in advance during peak weeks.",
        url: "https://www.mtbachelor.com/",
      },
      {
        id: "bachelor-nordic",
        name: "Mt. Bachelor Nordic Center",
        description:
          "56 km of groomed cross-country trails through snow-covered forests at the base of the volcano. Rentals and lessons available for all skill levels.",
        image:
          "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80",
        imageAlt: "Cross-country skier on a snowy forest trail",
        distance: "24 min drive",
        season: "December through March",
        tip: "The Twilight Trail is magical under the lights.",
        url: "https://www.mtbachelor.com/nordic/",
      },
      {
        id: "hoodoo-ski",
        name: "Hoodoo Ski Area",
        description:
          "A fun, family-friendly ski area on Santiam Pass with night skiing, affordable tickets, and a laid-back vibe. Smaller than Bachelor but less crowded.",
        image:
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
        imageAlt: "Snowboarder on a mountain with pine trees",
        distance: "50 min drive",
        season: "December through March",
        tip: "Night skiing on weekends is a unique experience.",
        url: "https://www.hoodoo.com/",
      },
      {
        id: "bachelor-summer-lift",
        name: "Mt. Bachelor Scenic Chairlift",
        description:
          "Not just for winter — ride the Pine Marten lift in summer for hiking, mountain biking, and panoramic views from 9,000 ft. Cool escape on hot days.",
        image:
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        imageAlt: "Mountain summit view above the clouds",
        distance: "24 min drive",
        season: "July through September",
        tip: "Bring a jacket — it's 20° cooler at the top.",
        url: "https://www.mtbachelor.com/summer/",
      },
    ],
  },
  {
    id: "mountain-biking",
    title: "Mountain Biking",
    subtitle:
      "Central Oregon is a mountain biking mecca — from Sunriver's paved paths to Bend's legendary singletrack.",
    activities: [
      {
        id: "phils-trail",
        name: "Phil's Trail Complex",
        description:
          "Bend's most beloved trail network — flowing singletrack through ponderosa pine with options from mellow to technical. Dozens of interconnected loops.",
        image:
          "https://images.unsplash.com/photo-1544197150-b99a580bb7af?w=800&q=80",
        imageAlt: "Mountain biker on a forest trail",
        distance: "25 min drive to Bend trailheads",
        season: "April through October",
        tip: "Start with 'Phil's Trail' proper — the original and still the best intro.",
        url: "https://www.trailforks.com/region/phil-s-trail-area/",
      },
      {
        id: "wanoga-snow",
        name: "Wanoga Snow Park Trails",
        description:
          "In winter, this sno-park transforms into fat-bike and cross-country ski terrain. In summer, nearby trails like Swampy Lakes offer high-elevation riding.",
        image:
          "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
        imageAlt: "Mountain biker riding through a pine forest",
        distance: "20 min drive",
        season: "Year-round (seasonal trail conditions vary)",
        tip: "Check Trailforks for current trail conditions before heading out.",
      },
      {
        id: "bachelor-bike-park",
        name: "Mt. Bachelor Bike Park",
        description:
          "Lift-served downhill mountain biking in summer — no pedaling uphill required. Trails from green to double-black with full-suspension rentals at the base.",
        image:
          "https://images.unsplash.com/photo-1576435728670-68d0fbf94e85?w=800&q=80",
        imageAlt: "Downhill mountain biker on a forest trail",
        distance: "24 min drive",
        season: "June through September",
        tip: "Rent a downhill bike at the base — it's worth it.",
        url: "https://www.mtbachelor.com/summer/bike-park/",
      },
      {
        id: "sunriver-paths",
        name: "Sunriver Paved Path Network",
        description:
          "34+ miles of car-free paved paths through Sunriver — perfect for family rides. Grab a bike from our garage and explore the river, Village, and golf courses.",
        image:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        imageAlt: "Family biking on a paved path through trees",
        distance: "From the front door",
        season: "Year-round",
        tip: "Ride to the Village for breakfast, then loop back via the river trail.",
      },
      {
        id: "tiddlywinks",
        name: "Tiddlywinks & Forest Service Trails",
        description:
          "Playful, berm-filled flow trails near Bend that feel like a roller coaster on two wheels. Popular with intermediate riders looking for fun, not suffering.",
        image:
          "https://images.unsplash.com/photo-1576435728670-68d0fbf94e85?w=800&q=80",
        imageAlt: "Mountain biker navigating a berm on a flow trail",
        distance: "25 min drive",
        season: "May through October",
        tip: "Ride mid-week to avoid crowds.",
      },
    ],
  },
  {
    id: "scenic-adventures",
    title: "Scenic & Day Trips",
    subtitle:
      "The can't-miss experiences that make Central Oregon unforgettable.",
    activities: [
      {
        id: "crater-lake",
        name: "Crater Lake National Park",
        description:
          "The deepest lake in the US, filling a collapsed volcano caldera with impossibly blue water. Rim Drive, boat tours to Wizard Island, and hikes for every ability.",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Crater_Lake_National_Park_in_Oregon.jpg/1280px-Crater_Lake_National_Park_in_Oregon.jpg",
        imageAlt: "Crater Lake with deep blue water and volcanic rim",
        distance: "2 hour drive",
        season: "June through October (full Rim Drive)",
        tip: "Enter from the north entrance for the shortest drive from Sunriver.",
        url: "https://www.nps.gov/crla/",
      },
      {
        id: "lava-river-cave",
        name: "Lava River Cave",
        description:
          "Explore a mile-long lava tube — bring flashlights and warm layers for this underground adventure. One of the longest lava tubes in Oregon.",
        image:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        imageAlt: "Dark cave tunnel with light at the end",
        distance: "15 min drive",
        season: "May through September",
        tip: "Rent lanterns at the entrance — phone flashlights aren't enough.",
        url: "https://www.fs.usda.gov/recarea/deschutes/recarea/?recid=38368",
      },
      {
        id: "high-desert-museum",
        name: "High Desert Museum",
        description:
          "World-class museum blending live wildlife, Oregon history, and art. Otters, raptors, a 1904 homestead, and immersive exhibits — great for rainy days or mid-day heat.",
        image:
          "https://images.unsplash.com/photo-1518173946687-a12639d2ab8e?w=800&q=80",
        imageAlt: "Natural history museum exhibit with wildlife",
        distance: "10 min drive",
        season: "Year-round",
        tip: "Allow at least 3 hours — there's a lot to see.",
        url: "https://www.highdesertmuseum.org/",
      },
      {
        id: "newberry-caldera",
        name: "Newberry National Volcanic Monument",
        description:
          "A massive shield volcano with obsidian flows, Paulina Falls, hot springs, and two crater lakes. Central Oregon's volcanic heart.",
        image:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        imageAlt: "Volcanic landscape with lake and forest",
        distance: "45 min drive",
        season: "June through October",
        tip: "Stop at Paulina Falls on the way in — a quick, rewarding hike.",
        url: "https://www.fs.usda.gov/recarea/deschutes/recarea/?recid=71762",
      },
      {
        id: "stargazing",
        name: "Sunriver Stargazing",
        description:
          "Sunriver's dark skies are among the best in Oregon. Step onto the back deck after dark — the Milky Way on a clear moonless night will stop you in your tracks.",
        image:
          "https://images.unsplash.com/photo-1419242902214-272b3b66fff7?w=800&q=80",
        imageAlt: "Starry night sky over a dark landscape",
        distance: "Your back deck",
        season: "Clear nights, year-round",
        tip: "New moon weeks are best. Turn off deck lights for 10 minutes.",
      },
    ],
  },
  {
    id: "golf-family",
    title: "Golf & Family Fun",
    subtitle:
      "On-course walks, trail rides, and Village entertainment for every age.",
    activities: [
      {
        id: "woodlands-golf",
        name: "Woodlands Golf Course",
        description:
          "Our home sits between the 1st and 10th holes — stroll to the clubhouse or driving range in minutes. A classic Central Oregon course through ponderosa pine.",
        image:
          "https://images.unsplash.com/photo-1535131749006-b7f58c99034e?w=800&q=80",
        imageAlt: "Golf course fairway lined with pine trees",
        distance: "5 min walk",
        season: "April through October",
        tip: "McDivot's Cafe at the clubhouse is perfect for a post-round drink.",
      },
      {
        id: "crosswater",
        name: "Crosswater Club",
        description:
          "A world-renowned golf course designed by Peter Jacobsen and Jim Hardy — two courses ranked among the best in the Pacific Northwest. Public tee times available.",
        image:
          "https://images.unsplash.com/photo-1587174485713-feaaee1f8b76?w=800&q=80",
        imageAlt: "Scenic golf course with mountain backdrop",
        distance: "10 min drive",
        season: "April through October",
        tip: "Book well ahead — this is a bucket-list course.",
        url: "https://www.crosswater.com/",
      },
      {
        id: "sunriver-stables",
        name: "Sunriver Stables",
        description:
          "Guided trail rides through the pines for all experience levels, plus pony rides for little ones. A memorable family outing in any season.",
        image:
          "https://images.unsplash.com/photo-1553284965-83fd3e82fa5f?w=800&q=80",
        imageAlt: "Horseback riding on a forest trail",
        distance: "8 min drive",
        season: "Year-round",
        tip: "Book the sunset ride for golden light through the trees.",
        url: "https://www.sunriverstables.com/",
      },
      {
        id: "village-sunriver",
        name: "The Village at Sunriver",
        description:
          "The heart of Sunriver — shops, restaurants, an ice rink in winter, live music in summer, and events year-round. A five-minute bike ride from the house.",
        image:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
        imageAlt: "Forest village with shops and pathways",
        distance: "5 min by bike",
        season: "Year-round",
        tip: "Check the events calendar for concerts and festivals.",
        url: "https://www.sunriverresort.com/explore/village-at-sunriver",
      },
    ],
  },
];

export function getActivityLink(activity: Activity): string | undefined {
  return activity.affiliateUrl ?? activity.url;
}
