"""
MIT Thandavapura (Maharaja Institute of Technology Thandavapura)
Comprehensive Bus Transit Network — 28 Routes, Stops & Student Allocations.
Academic Year 2026-2027
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.bus_route import BusRoute
from app.models.bus_stop import BusStop
from app.models.student_bus_assignment import StudentBusAssignment
from app.models.student import Student

BUS_ROUTES_DATA: List[Dict[str, Any]] = [
    {
        "route_number": 1,
        "route_name": "Route 1 - Suburban Bus Stand / Agrahara",
        "bus_number": "KA-09-F-1001",
        "driver_name": "Suresh Gowda",
        "driver_phone": "+91 98450 12301",
        "start_point": "Suburban Bus Stand",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:45 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Suburban Bus Stand", "stop_order": 1, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "Hardinge Circle", "stop_order": 2, "pickup_time": "07:50 AM", "drop_time": "05:20 PM"},
            {"stop_name": "Agrahara Circle", "stop_order": 3, "pickup_time": "07:55 AM", "drop_time": "05:15 PM"},
            {"stop_name": "Chamundipuram", "stop_order": 4, "pickup_time": "08:02 AM", "drop_time": "05:08 PM"},
            {"stop_name": "Bandipalya APMC", "stop_order": 5, "pickup_time": "08:15 AM", "drop_time": "04:55 PM"},
            {"stop_name": "Kadakola Toll", "stop_order": 6, "pickup_time": "08:25 AM", "drop_time": "04:45 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 7, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 2,
        "route_name": "Route 2 - Vijayanagar 4th Stage / Abhishek Circle",
        "bus_number": "KA-09-F-1002",
        "driver_name": "Basavaraju M",
        "driver_phone": "+91 98450 12302",
        "start_point": "Abhishek Circle",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:35 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Abhishek Circle", "stop_order": 1, "pickup_time": "07:35 AM", "drop_time": "05:35 PM"},
            {"stop_name": "Vijayanagar Water Tank", "stop_order": 2, "pickup_time": "07:42 AM", "drop_time": "05:28 PM"},
            {"stop_name": "Basaveshwara Circle", "stop_order": 3, "pickup_time": "07:50 AM", "drop_time": "05:20 PM"},
            {"stop_name": "Bogadi Ring Road Signal", "stop_order": 4, "pickup_time": "08:00 AM", "drop_time": "05:10 PM"},
            {"stop_name": "Bandipalya Toll", "stop_order": 5, "pickup_time": "08:18 AM", "drop_time": "04:50 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 6, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 3,
        "route_name": "Route 3 - Kuvempunagar / Vivekananda Nagar",
        "bus_number": "KA-09-F-1003",
        "driver_name": "Shivanna N",
        "driver_phone": "+91 98450 12303",
        "start_point": "Vivekananda Nagar Circle",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:40 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Vivekananda Nagar Circle", "stop_order": 1, "pickup_time": "07:40 AM", "drop_time": "05:30 PM"},
            {"stop_name": "Kuvempunagar Complex", "stop_order": 2, "pickup_time": "07:48 AM", "drop_time": "05:22 PM"},
            {"stop_name": "Jayanagar Railway Gate", "stop_order": 3, "pickup_time": "07:56 AM", "drop_time": "05:14 PM"},
            {"stop_name": "Ashokapuram Post Office", "stop_order": 4, "pickup_time": "08:05 AM", "drop_time": "05:05 PM"},
            {"stop_name": "Kadakola Junction", "stop_order": 5, "pickup_time": "08:24 AM", "drop_time": "04:45 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 6, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 4,
        "route_name": "Route 4 - Saraswathipuram / K.G. Koppal",
        "bus_number": "KA-09-F-1004",
        "driver_name": "Ramesh Kumar P",
        "driver_phone": "+91 98450 12304",
        "start_point": "Saraswathipuram Fire Station",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:45 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Saraswathipuram Fire Station", "stop_order": 1, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "K.G. Koppal Underbridge", "stop_order": 2, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Chamarajapuram Station", "stop_order": 3, "pickup_time": "08:00 AM", "drop_time": "05:10 PM"},
            {"stop_name": "Ballal Circle", "stop_order": 4, "pickup_time": "08:06 AM", "drop_time": "05:04 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 5,
        "route_name": "Route 5 - Hebbal / Surya Bakery / Vijayanagar",
        "bus_number": "KA-09-F-1005",
        "driver_name": "Mahadevaswamy C",
        "driver_phone": "+91 98450 12305",
        "start_point": "Surya Bakery",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:35 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Surya Bakery", "stop_order": 1, "pickup_time": "07:35 AM", "drop_time": "05:35 PM"},
            {"stop_name": "Hebbal Lake Ring Road", "stop_order": 2, "pickup_time": "07:42 AM", "drop_time": "05:28 PM"},
            {"stop_name": "Vijayanagar Club", "stop_order": 3, "pickup_time": "07:50 AM", "drop_time": "05:20 PM"},
            {"stop_name": "Bogadi 2nd Stage", "stop_order": 4, "pickup_time": "08:02 AM", "drop_time": "05:08 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 6,
        "route_name": "Route 6 - Gokulam / V.V. Mohalla / Ramaswamy Circle",
        "bus_number": "KA-09-F-1006",
        "driver_name": "Puttaswamy G",
        "driver_phone": "+91 98450 12306",
        "start_point": "Gokulam 3rd Stage",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:40 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Gokulam 3rd Stage", "stop_order": 1, "pickup_time": "07:40 AM", "drop_time": "05:30 PM"},
            {"stop_name": "V.V. Mohalla Post Office", "stop_order": 2, "pickup_time": "07:48 AM", "drop_time": "05:22 PM"},
            {"stop_name": "Ramaswamy Circle", "stop_order": 3, "pickup_time": "07:58 AM", "drop_time": "05:12 PM"},
            {"stop_name": "Gun House Circle", "stop_order": 4, "pickup_time": "08:08 AM", "drop_time": "05:02 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 7,
        "route_name": "Route 7 - Bogadi 2nd Stage / Maruthi Temple",
        "bus_number": "KA-09-F-1007",
        "driver_name": "Jagadeesh R",
        "driver_phone": "+91 98450 12307",
        "start_point": "Maruthi Temple Bogadi",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:42 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Maruthi Temple Bogadi", "stop_order": 1, "pickup_time": "07:42 AM", "drop_time": "05:28 PM"},
            {"stop_name": "Gangothri Layout", "stop_order": 2, "pickup_time": "07:50 AM", "drop_time": "05:20 PM"},
            {"stop_name": "Saraswathipuram Swimming Pool", "stop_order": 3, "pickup_time": "07:58 AM", "drop_time": "05:12 PM"},
            {"stop_name": "Ramakrishna Vidyashala", "stop_order": 4, "pickup_time": "08:06 AM", "drop_time": "05:04 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 8,
        "route_name": "Route 8 - J.P. Nagar / Gobli Mara / Vidyaranyapuram",
        "bus_number": "KA-09-F-1008",
        "driver_name": "Lingaraju S",
        "driver_phone": "+91 98450 12308",
        "start_point": "Gobli Mara Circle",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:48 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Gobli Mara Circle", "stop_order": 1, "pickup_time": "07:48 AM", "drop_time": "05:22 PM"},
            {"stop_name": "J.P. Nagar Police Station", "stop_order": 2, "pickup_time": "07:55 AM", "drop_time": "05:15 PM"},
            {"stop_name": "Vidyaranyapuram Main Road", "stop_order": 3, "pickup_time": "08:02 AM", "drop_time": "05:08 PM"},
            {"stop_name": "Silk Factory Signal", "stop_order": 4, "pickup_time": "08:10 AM", "drop_time": "05:00 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 9,
        "route_name": "Route 9 - Siddhartha Layout / T. Narasipura Ring Road",
        "bus_number": "KA-09-F-1009",
        "driver_name": "Anand Kumar M",
        "driver_phone": "+91 98450 12309",
        "start_point": "Siddhartha Layout Bus Stand",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:45 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Siddhartha Layout Bus Stand", "stop_order": 1, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "T. Narasipura Ring Road Junction", "stop_order": 2, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Alanahalli Circle", "stop_order": 3, "pickup_time": "08:00 AM", "drop_time": "05:10 PM"},
            {"stop_name": "Bandipalya Toll Gate", "stop_order": 4, "pickup_time": "08:14 AM", "drop_time": "04:56 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 10,
        "route_name": "Route 10 - Alanahalli / Lalitha Mahal / Nazarbad",
        "bus_number": "KA-09-F-1010",
        "driver_name": "Chandrashekar B",
        "driver_phone": "+91 98450 12310",
        "start_point": "Nazarbad Post Office",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:45 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Nazarbad Post Office", "stop_order": 1, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "Lalitha Mahal Palace Gate", "stop_order": 2, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Alanahalli Village Cross", "stop_order": 3, "pickup_time": "08:00 AM", "drop_time": "05:10 PM"},
            {"stop_name": "Uttanahalli Handpost", "stop_order": 4, "pickup_time": "08:12 AM", "drop_time": "04:58 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 11,
        "route_name": "Route 11 - R.S. Naidu Nagar / Fountain Circle",
        "bus_number": "KA-09-F-1011",
        "driver_name": "Mahesha T",
        "driver_phone": "+91 98450 12311",
        "start_point": "R.S. Naidu Nagar Depot",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:35 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "R.S. Naidu Nagar Depot", "stop_order": 1, "pickup_time": "07:35 AM", "drop_time": "05:35 PM"},
            {"stop_name": "N.R. Mohalla St. Philomena", "stop_order": 2, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "Fountain Circle", "stop_order": 3, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Agrahara Signal", "stop_order": 4, "pickup_time": "08:04 AM", "drop_time": "05:06 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 12,
        "route_name": "Route 12 - Kuvempunagar Depot / Kamakshi Hospital",
        "bus_number": "KA-09-F-1012",
        "driver_name": "Manjunath K",
        "driver_phone": "+91 98450 67890",
        "start_point": "Kuvempunagar Depot",
        "end_point": "Campus Main Gate",
        "departure_time": "07:45 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Kuvempunagar Depot", "stop_order": 1, "pickup_time": "07:45 AM", "drop_time": "05:15 PM"},
            {"stop_name": "Kamakshi Hospital", "stop_order": 2, "pickup_time": "07:55 AM", "drop_time": "05:05 PM"},
            {"stop_name": "Saraswathipuram Fire Station", "stop_order": 3, "pickup_time": "08:10 AM", "drop_time": "04:50 PM"},
            {"stop_name": "Campus Main Gate", "stop_order": 4, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 13,
        "route_name": "Route 13 - Ramakrishna Nagar / Srirampura",
        "bus_number": "KA-09-F-1013",
        "driver_name": "Ravindra N",
        "driver_phone": "+91 98450 12313",
        "start_point": "Andolana Circle",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:45 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Andolana Circle", "stop_order": 1, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "Ramakrishna Nagar E&F Block", "stop_order": 2, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Srirampura Water Tank", "stop_order": 3, "pickup_time": "08:00 AM", "drop_time": "05:10 PM"},
            {"stop_name": "Kadakola Industrial Area", "stop_order": 4, "pickup_time": "08:20 AM", "drop_time": "04:50 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 14,
        "route_name": "Route 14 - Dattagalli / Kanakadasa Nagar Ring Road",
        "bus_number": "KA-09-F-1014",
        "driver_name": "Venkatesh P",
        "driver_phone": "+91 98450 12314",
        "start_point": "Dattagalli Ring Road",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:40 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Dattagalli Ring Road", "stop_order": 1, "pickup_time": "07:40 AM", "drop_time": "05:30 PM"},
            {"stop_name": "Kanakadasa Nagar Park", "stop_order": 2, "pickup_time": "07:48 AM", "drop_time": "05:22 PM"},
            {"stop_name": "Lingambudhi Lake Circle", "stop_order": 3, "pickup_time": "07:58 AM", "drop_time": "05:12 PM"},
            {"stop_name": "Kadakola Bypass", "stop_order": 4, "pickup_time": "08:22 AM", "drop_time": "04:48 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 15,
        "route_name": "Route 15 - Jayalakshmipuram / Mathrumandali / CFTRI",
        "bus_number": "KA-09-F-1015",
        "driver_name": "Nagaraju H",
        "driver_phone": "+91 98450 12315",
        "start_point": "Mathrumandali Circle",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:42 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Mathrumandali Circle", "stop_order": 1, "pickup_time": "07:42 AM", "drop_time": "05:28 PM"},
            {"stop_name": "Kalidasa Road", "stop_order": 2, "pickup_time": "07:49 AM", "drop_time": "05:21 PM"},
            {"stop_name": "CFTRI Main Gate", "stop_order": 3, "pickup_time": "07:56 AM", "drop_time": "05:14 PM"},
            {"stop_name": "Ramaswamy Circle", "stop_order": 4, "pickup_time": "08:04 AM", "drop_time": "05:06 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 16,
        "route_name": "Route 16 - Metagalli / Kumbarakoppal / Railway Station",
        "bus_number": "KA-09-F-1016",
        "driver_name": "Siddaraju V",
        "driver_phone": "+91 98450 12316",
        "start_point": "Metagalli Police Station",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:35 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Metagalli Police Station", "stop_order": 1, "pickup_time": "07:35 AM", "drop_time": "05:35 PM"},
            {"stop_name": "Kumbarakoppal Handpost", "stop_order": 2, "pickup_time": "07:44 AM", "drop_time": "05:26 PM"},
            {"stop_name": "Mysore City Railway Station", "stop_order": 3, "pickup_time": "07:55 AM", "drop_time": "05:15 PM"},
            {"stop_name": "Hardinge Circle", "stop_order": 4, "pickup_time": "08:05 AM", "drop_time": "05:05 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 17,
        "route_name": "Route 17 - Nanjangud Town / Old Bus Stand",
        "bus_number": "KA-09-F-1017",
        "driver_name": "Swamy Gowda S",
        "driver_phone": "+91 98450 12317",
        "start_point": "Nanjangud Old Bus Stand",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "08:00 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Nanjangud Old Bus Stand", "stop_order": 1, "pickup_time": "08:00 AM", "drop_time": "05:10 PM"},
            {"stop_name": "Gundlupet Circle Nanjangud", "stop_order": 2, "pickup_time": "08:08 AM", "drop_time": "05:02 PM"},
            {"stop_name": "Srikanteshwara Temple Cross", "stop_order": 3, "pickup_time": "08:15 AM", "drop_time": "04:55 PM"},
            {"stop_name": "Sujathapuram Gate", "stop_order": 4, "pickup_time": "08:25 AM", "drop_time": "04:45 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 18,
        "route_name": "Route 18 - Nanjangud Industrial Area / Hullahalli Circle",
        "bus_number": "KA-09-F-1018",
        "driver_name": "Girish Kumar K",
        "driver_phone": "+91 98450 12318",
        "start_point": "Hullahalli Circle Nanjangud",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:55 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Hullahalli Circle Nanjangud", "stop_order": 1, "pickup_time": "07:55 AM", "drop_time": "05:15 PM"},
            {"stop_name": "KIADB Industrial Area", "stop_order": 2, "pickup_time": "08:05 AM", "drop_time": "05:05 PM"},
            {"stop_name": "Jubilant Life Sciences Gate", "stop_order": 3, "pickup_time": "08:15 AM", "drop_time": "04:55 PM"},
            {"stop_name": "Thandavapura Railway Station", "stop_order": 4, "pickup_time": "08:26 AM", "drop_time": "04:44 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 19,
        "route_name": "Route 19 - T. Narasipura / Somanathapura / Varuna",
        "bus_number": "KA-09-F-1019",
        "driver_name": "Madhusudhan B",
        "driver_phone": "+91 98450 12319",
        "start_point": "T. Narasipura KSRTC Bus Stand",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:30 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "T. Narasipura KSRTC Bus Stand", "stop_order": 1, "pickup_time": "07:30 AM", "drop_time": "05:40 PM"},
            {"stop_name": "Somanathapura Cross", "stop_order": 2, "pickup_time": "07:42 AM", "drop_time": "05:28 PM"},
            {"stop_name": "Gargeshwari Handpost", "stop_order": 3, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Varuna Village Cross", "stop_order": 4, "pickup_time": "08:10 AM", "drop_time": "05:00 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 20,
        "route_name": "Route 20 - Mandya / Srirangapatna / Highway",
        "bus_number": "KA-09-F-1020",
        "driver_name": "Lokesh S",
        "driver_phone": "+91 98450 12320",
        "start_point": "Mandya KSRTC Bus Stand",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:15 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Mandya KSRTC Bus Stand", "stop_order": 1, "pickup_time": "07:15 AM", "drop_time": "05:55 PM"},
            {"stop_name": "Srirangapatna Kirangur Cross", "stop_order": 2, "pickup_time": "07:40 AM", "drop_time": "05:30 PM"},
            {"stop_name": "Manipal Hospital Ring Road", "stop_order": 3, "pickup_time": "07:55 AM", "drop_time": "05:15 PM"},
            {"stop_name": "South Ring Road Junction", "stop_order": 4, "pickup_time": "08:12 AM", "drop_time": "04:58 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 21,
        "route_name": "Route 21 - Bannur / Rangacharihundi / Gargeshwari",
        "bus_number": "KA-09-F-1021",
        "driver_name": "Chandru G",
        "driver_phone": "+91 98450 12321",
        "start_point": "Bannur Old Bus Stand",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:30 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Bannur Old Bus Stand", "stop_order": 1, "pickup_time": "07:30 AM", "drop_time": "05:40 PM"},
            {"stop_name": "Rangacharihundi Circle", "stop_order": 2, "pickup_time": "07:42 AM", "drop_time": "05:28 PM"},
            {"stop_name": "Varakodu Cross", "stop_order": 3, "pickup_time": "07:56 AM", "drop_time": "05:14 PM"},
            {"stop_name": "Uttanahalli Handpost", "stop_order": 4, "pickup_time": "08:14 AM", "drop_time": "04:56 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 22,
        "route_name": "Route 22 - Chamarajanagar / Santhemarahalli / Kavalande",
        "bus_number": "KA-09-F-1022",
        "driver_name": "Shivaswamy C",
        "driver_phone": "+91 98450 12322",
        "start_point": "Chamarajanagar B.R. Hills Road",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:20 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Chamarajanagar B.R. Hills Road", "stop_order": 1, "pickup_time": "07:20 AM", "drop_time": "05:50 PM"},
            {"stop_name": "Santhemarahalli Circle", "stop_order": 2, "pickup_time": "07:38 AM", "drop_time": "05:32 PM"},
            {"stop_name": "Kavalande Handpost", "stop_order": 3, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Nanjangud South Bypass", "stop_order": 4, "pickup_time": "08:12 AM", "drop_time": "04:58 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 23,
        "route_name": "Route 23 - Gundlupet / Begur / Nanjangud",
        "bus_number": "KA-09-F-1023",
        "driver_name": "Manje Gowda M",
        "driver_phone": "+91 98450 12323",
        "start_point": "Gundlupet Bus Stand",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:20 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Gundlupet Bus Stand", "stop_order": 1, "pickup_time": "07:20 AM", "drop_time": "05:50 PM"},
            {"stop_name": "Begur Handpost", "stop_order": 2, "pickup_time": "07:40 AM", "drop_time": "05:30 PM"},
            {"stop_name": "Kalale Handpost", "stop_order": 3, "pickup_time": "08:05 AM", "drop_time": "05:05 PM"},
            {"stop_name": "Nanjangud South Toll", "stop_order": 4, "pickup_time": "08:20 AM", "drop_time": "04:50 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 24,
        "route_name": "Route 24 - Hunsur Road / Hinkal / Ilavala",
        "bus_number": "KA-09-F-1024",
        "driver_name": "Rajesh Kumar N",
        "driver_phone": "+91 98450 12324",
        "start_point": "Ilavala Handpost",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:25 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Ilavala Handpost", "stop_order": 1, "pickup_time": "07:25 AM", "drop_time": "05:45 PM"},
            {"stop_name": "Hinkal Flyover Signal", "stop_order": 2, "pickup_time": "07:38 AM", "drop_time": "05:32 PM"},
            {"stop_name": "Bogadi Ring Road Junction", "stop_order": 3, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Bandipalya Toll Gate", "stop_order": 4, "pickup_time": "08:15 AM", "drop_time": "04:55 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 25,
        "route_name": "Route 25 - Sriramapura 2nd Stage / Lingambudhi",
        "bus_number": "KA-09-F-1025",
        "driver_name": "Umesh B",
        "driver_phone": "+91 98450 12325",
        "start_point": "Kanakadasa Nagar Main Bus Stop",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:44 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Kanakadasa Nagar Main Bus Stop", "stop_order": 1, "pickup_time": "07:44 AM", "drop_time": "05:26 PM"},
            {"stop_name": "Sriramapura 2nd Stage", "stop_order": 2, "pickup_time": "07:52 AM", "drop_time": "05:18 PM"},
            {"stop_name": "Lingambudhi Palya Circle", "stop_order": 3, "pickup_time": "08:02 AM", "drop_time": "05:08 PM"},
            {"stop_name": "Kadakola Toll Gate", "stop_order": 4, "pickup_time": "08:22 AM", "drop_time": "04:48 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 26,
        "route_name": "Route 26 - Chamundi Hill Foot / Tavarekatte / Ittigegudu",
        "bus_number": "KA-09-F-1026",
        "driver_name": "Prakash R",
        "driver_phone": "+91 98450 12326",
        "start_point": "Ittigegudu Zoo Gate",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:45 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Ittigegudu Zoo Gate", "stop_order": 1, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "Tavarekatte Hill Steps", "stop_order": 2, "pickup_time": "07:55 AM", "drop_time": "05:15 PM"},
            {"stop_name": "Uttanahalli Cross", "stop_order": 3, "pickup_time": "08:08 AM", "drop_time": "05:02 PM"},
            {"stop_name": "Gejjalagere Handpost", "stop_order": 4, "pickup_time": "08:20 AM", "drop_time": "04:50 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 27,
        "route_name": "Route 27 - Bannimantap / Highway Circle / LIC Colony",
        "bus_number": "KA-09-F-1027",
        "driver_name": "Prabhakar K",
        "driver_phone": "+91 98450 12327",
        "start_point": "Highway Circle Bannimantap",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "07:38 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Highway Circle Bannimantap", "stop_order": 1, "pickup_time": "07:38 AM", "drop_time": "05:32 PM"},
            {"stop_name": "LIC Colony Bannimantap", "stop_order": 2, "pickup_time": "07:45 AM", "drop_time": "05:25 PM"},
            {"stop_name": "Suburban Bus Stand", "stop_order": 3, "pickup_time": "07:58 AM", "drop_time": "05:12 PM"},
            {"stop_name": "Gun House Circle", "stop_order": 4, "pickup_time": "08:08 AM", "drop_time": "05:02 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
    {
        "route_number": 28,
        "route_name": "Route 28 - Kadakola / Sujathapuram / Thandavapura",
        "bus_number": "KA-09-F-1028",
        "driver_name": "Anandappa M",
        "driver_phone": "+91 98450 12328",
        "start_point": "Kadakola Town Circle",
        "end_point": "MITT Campus Main Gate",
        "departure_time": "08:00 AM",
        "arrival_time": "08:35 AM",
        "stops": [
            {"stop_name": "Kadakola Town Circle", "stop_order": 1, "pickup_time": "08:00 AM", "drop_time": "05:10 PM"},
            {"stop_name": "Kadakola Railway Gate", "stop_order": 2, "pickup_time": "08:08 AM", "drop_time": "05:02 PM"},
            {"stop_name": "Sujathapuram Handpost", "stop_order": 3, "pickup_time": "08:18 AM", "drop_time": "04:52 PM"},
            {"stop_name": "Thandavapura Village Temple", "stop_order": 4, "pickup_time": "08:26 AM", "drop_time": "04:44 PM"},
            {"stop_name": "MITT Campus Main Gate", "stop_order": 5, "pickup_time": "08:35 AM", "drop_time": "04:30 PM"},
        ],
    },
]


def seed_bus_routes_and_assignments(db: Session):
    """
    Seeds or updates all 28 bus routes, their stops,
    and assigns all 133 verified students across the active transit routes.
    """
    print("[*] Seeding/Updating MITT Campus Transit System (28 Routes)...")

    route_entities = {}
    stops_by_route = {}

    for r_data in BUS_ROUTES_DATA:
        r_num = r_data["route_number"]
        route = db.query(BusRoute).filter(BusRoute.route_number == r_num).first()

        if not route:
            route = BusRoute(
                route_number=r_num,
                route_name=r_data["route_name"],
                bus_number=r_data["bus_number"],
                driver_name=r_data["driver_name"],
                driver_phone=r_data["driver_phone"],
                start_point=r_data["start_point"],
                end_point=r_data["end_point"],
                departure_time=r_data["departure_time"],
                arrival_time=r_data["arrival_time"],
                status="active",
            )
            db.add(route)
            db.commit()
            db.refresh(route)
        else:
            # Update fields so existing routes get real driver, bus, and timing info
            route.route_name = r_data["route_name"]
            route.bus_number = r_data["bus_number"]
            route.driver_name = r_data["driver_name"]
            route.driver_phone = r_data["driver_phone"]
            route.start_point = r_data["start_point"]
            route.end_point = r_data["end_point"]
            route.departure_time = r_data["departure_time"]
            route.arrival_time = r_data["arrival_time"]
            route.status = "active"
            db.commit()
            db.refresh(route)

        route_entities[r_num] = route

        # Seed or refresh stops for this route
        route_stops = []
        for s_data in r_data["stops"]:
            stop = db.query(BusStop).filter(
                BusStop.route_id == route.id,
                BusStop.stop_name == s_data["stop_name"]
            ).first()

            if not stop:
                stop = BusStop(
                    route_id=route.id,
                    stop_name=s_data["stop_name"],
                    stop_order=s_data["stop_order"],
                    pickup_time=s_data["pickup_time"],
                    drop_time=s_data["drop_time"],
                    status="active",
                )
                db.add(stop)
                db.commit()
                db.refresh(stop)
            else:
                stop.stop_order = s_data["stop_order"]
                stop.pickup_time = s_data["pickup_time"]
                stop.drop_time = s_data["drop_time"]
                stop.status = "active"
                db.commit()
                db.refresh(stop)

            route_stops.append(stop)

        stops_by_route[r_num] = route_stops

    print(f"[+] All 28 bus routes and stops verified in database.")

    # Now assign all 133 verified students
    students = db.query(Student).order_by(Student.id.asc()).all()
    if not students:
        print("[!] No students found in database to assign buses to.")
        return

    assigned_count = 0
    # Map specific popular accounts for demo consistency
    # 4MN24CS002 -> Route 1 (Suburban Bus Stand)
    # 4MN24CS003 -> Route 12 (Kuvempunagar Depot)
    explicit_map = {
        "4MN24CS002": (1, 0),  # Route 1, stop 0 (Suburban Bus Stand)
        "4MN24CS003": (12, 0), # Route 12, stop 0 (Kuvempunagar Depot)
    }

    # Available route numbers
    route_keys = list(route_entities.keys())
    num_routes = len(route_keys)

    for idx, student in enumerate(students):
        stu_usn = (student.usn or "").strip().upper()

        if stu_usn in explicit_map:
            target_route_num, stop_idx = explicit_map[stu_usn]
        else:
            # Deterministic, realistic distribution across all 28 routes
            target_route_num = route_keys[idx % num_routes]
            route_stops = stops_by_route[target_route_num]
            # Pick a realistic boarding stop (first or intermediate stop, not the destination campus gate)
            selectable_stops = route_stops[:-1] if len(route_stops) > 1 else route_stops
            stop_idx = (idx // num_routes) % len(selectable_stops)

        target_route = route_entities[target_route_num]
        target_stop = stops_by_route[target_route_num][stop_idx]

        assignment = db.query(StudentBusAssignment).filter(
            StudentBusAssignment.student_id == student.id
        ).first()

        if not assignment:
            assignment = StudentBusAssignment(
                student_id=student.id,
                route_id=target_route.id,
                stop_id=target_stop.id,
                transport_status="Using Bus",
            )
            db.add(assignment)
        else:
            assignment.route_id = target_route.id
            assignment.stop_id = target_stop.id
            assignment.transport_status = "Using Bus"

        assigned_count += 1

    db.commit()
    print(f"[+] Successfully allocated bus routes and transit stops for all {assigned_count} students!")
