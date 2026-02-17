-- ============================================
-- Vehicle Known Issues — Comprehensive Seed Data
-- Run this in Supabase SQL editor to populate known issues
-- Sources: NHTSA, TSB, Consumer Reports, CarComplaints.com
-- ============================================

-- Clear existing seed data (keeps any admin-added entries)
DELETE FROM public.vehicle_known_issues WHERE source IN ('NHTSA', 'TSB', 'Consumer Reports', 'CarComplaints.com', 'user-reported', 'Class Action');

INSERT INTO public.vehicle_known_issues (make, model, year_start, year_end, category, severity, title, description, source) VALUES

-- ============================================
-- HONDA
-- ============================================

-- Honda Civic 2006-2011 (8th gen)
('Honda', 'Civic', 2006, 2009, 'engine', 'critical', 'Cracked Engine Block', 'Manufacturing defect causes engine block to crack, leaking coolant and causing overheating. Check for coolant residue around block. Honda extended warranty to 10 years but coverage has expired for most.', 'NHTSA'),
('Honda', 'Civic', 2006, 2011, 'engine', 'medium', 'Motor Mount Wear', 'Engine and transmission mounts wear prematurely causing excessive vibration at idle and during acceleration. Grab the engine and check for excessive movement.', 'CarComplaints.com'),
('Honda', 'Civic', 2006, 2011, 'body', 'low', 'Clear Coat Peeling', 'Clear coat on paint peels and flakes, especially on roof and hood. Inspect paint finish closely in direct sunlight.', 'user-reported'),

-- Honda Civic 2016-2021 (10th gen)
('Honda', 'Civic', 2016, 2021, 'engine', 'high', '1.5T Oil Dilution', 'Fuel mixes with engine oil in the 1.5L turbo, especially in cold climates. Check oil level — if above full mark and smells like gas, the issue is present. Can cause long-term engine wear.', 'TSB'),
('Honda', 'Civic', 2016, 2018, 'other', 'medium', 'AC Condenser Failure', 'Factory AC condenser develops small holes causing refrigerant leak and loss of air conditioning. Honda extended warranty to 10 years. Test AC at full cold.', 'NHTSA'),
('Honda', 'Civic', 2016, 2021, 'body', 'low', 'Windshield Stress Cracking', 'Windshields crack without impact, possibly due to frame flex. Inspect for cracks radiating from edges.', 'user-reported'),

-- Honda Accord 2008-2012 (8th gen)
('Honda', 'Accord', 2008, 2012, 'engine', 'medium', 'VTC Actuator Rattle', 'Rattling or ticking noise on cold startup from the VTC actuator. Worsens in cold weather. Can stretch timing chain if ignored. Listen for rattle in first 5 seconds of cold start.', 'TSB'),
('Honda', 'Accord', 2008, 2012, 'engine', 'medium', 'Excessive Oil Consumption', 'Some 4-cylinder models consume oil at a high rate. Check oil level carefully and look for blue exhaust smoke.', 'Consumer Reports'),
('Honda', 'Accord', 2008, 2012, 'electrical', 'low', 'Power Door Lock Actuator Failure', 'Door lock actuators fail causing doors not to lock/unlock with remote or power switch. Test all four doors with key fob.', 'CarComplaints.com'),

-- Honda Accord 2013-2017 (9th gen)
('Honda', 'Accord', 2013, 2017, 'engine', 'medium', 'VTC Actuator Rattle', 'Cold start rattle from variable timing control actuator continues in this generation. Honda issued updated part. Listen for rattle on first startup of the day.', 'TSB'),
('Honda', 'Accord', 2013, 2017, 'transmission', 'medium', 'CVT Judder (4-cyl)', 'CVT-equipped 4-cylinder models may exhibit shuddering during light acceleration, particularly at low speeds. Test drive with gentle acceleration from stops.', 'user-reported'),

-- ============================================
-- TOYOTA
-- ============================================

-- Toyota Camry 2007-2011 (6th gen)
('Toyota', 'Camry', 2007, 2011, 'safety', 'critical', 'Unintended Acceleration / Sticky Pedal', 'Floor mat interference and sticky accelerator pedal recall. Verify recall has been performed. Check that floor mats are properly secured and pedal moves freely.', 'NHTSA'),
('Toyota', 'Camry', 2007, 2011, 'engine', 'high', 'Excessive Oil Consumption (2AZ-FE)', 'The 2.4L 4-cylinder engine consumes a quart of oil per 1,200 miles or less due to piston ring design. Check oil level on dipstick — low oil indicates the problem.', 'Consumer Reports'),
('Toyota', 'Camry', 2007, 2011, 'body', 'medium', 'Dashboard Melting/Cracking', 'Dashboard material cracks, melts, and becomes sticky in hot climates. Toyota offered warranty extension. Inspect dash surface for tackiness or cracks.', 'TSB'),
('Toyota', 'Camry', 2007, 2011, 'transmission', 'medium', 'Automatic Transmission Hesitation', 'Transmission lags and hesitates during acceleration, especially when merging. Test with firm acceleration from a stop.', 'CarComplaints.com'),

-- Toyota Camry 2012-2017 (7th gen)
('Toyota', 'Camry', 2012, 2017, 'engine', 'medium', 'Excessive Oil Consumption (2AR-FE)', 'Some 2.5L 4-cylinder engines consume excessive oil. Toyota issued warranty enhancement. Check oil level on dipstick.', 'TSB'),
('Toyota', 'Camry', 2012, 2017, 'electrical', 'low', 'Bluetooth Connectivity Issues', 'Infotainment system drops Bluetooth connections or fails to pair. Test phone pairing during inspection.', 'user-reported'),

-- Toyota Camry 2018-2023 (8th gen)
('Toyota', 'Camry', 2018, 2023, 'transmission', 'medium', 'Transmission Hesitation', '8-speed automatic hesitates when accelerating from a stop. Most noticeable in stop-and-go traffic. Test with varied acceleration.', 'user-reported'),
('Toyota', 'Camry', 2018, 2023, 'electrical', 'low', 'Infotainment Freezing', 'Touchscreen may freeze or become unresponsive, requiring vehicle restart. Test all infotainment functions.', 'TSB'),

-- Toyota Corolla 2009-2013
('Toyota', 'Corolla', 2009, 2013, 'engine', 'medium', 'Excessive Oil Consumption', '2ZR-FE engine may burn oil excessively. Check oil level and look for blue smoke from exhaust.', 'Consumer Reports'),
('Toyota', 'Corolla', 2009, 2013, 'body', 'low', 'Water Leak Into Interior', 'Water leaks into cabin through windshield seal or trunk. Check for musty smell or water stains on headliner and carpet.', 'CarComplaints.com'),

-- Toyota Corolla 2014-2019
('Toyota', 'Corolla', 2014, 2019, 'transmission', 'medium', 'CVT Shudder', 'CVT-equipped models may shudder or hesitate during acceleration. Test drive at various speeds.', 'user-reported'),
('Toyota', 'Corolla', 2014, 2019, 'electrical', 'low', 'Dashboard Rattle', 'Dashboard and interior trim rattles, especially on rough roads. Drive over uneven surfaces to check.', 'user-reported'),

-- Toyota RAV4 2006-2012
('Toyota', 'RAV4', 2006, 2008, 'engine', 'high', 'Excessive Oil Consumption (2AZ-FE)', '2.4L engine consumes excessive oil due to worn piston rings. Toyota issued Warranty Enhancement Program ZE7. Check oil level — low oil indicates the problem.', 'NHTSA'),
('Toyota', 'RAV4', 2006, 2012, 'transmission', 'medium', 'Transmission Shudder', 'Automatic transmission may shudder or hesitate, particularly during light acceleration. Test drive thoroughly.', 'CarComplaints.com'),

-- Toyota RAV4 2013-2018
('Toyota', 'RAV4', 2013, 2018, 'electrical', 'low', 'Entune System Freezing', 'Infotainment system freezes requiring vehicle restart. Test all screen functions during inspection.', 'user-reported'),
('Toyota', 'RAV4', 2013, 2018, 'other', 'low', 'Wind Noise at Highway Speed', 'Excessive wind noise from door seals at highway speeds. Test drive at 60+ mph and listen for whistling.', 'user-reported'),

-- Toyota RAV4 2019-2023
('Toyota', 'RAV4', 2019, 2023, 'transmission', 'medium', 'Rough Shifting / Delayed Engagement', 'Reports of rough shifting and delayed engagement, typically arising around 30-50k miles. Test drive in city stop-and-go traffic.', 'CarComplaints.com'),
('Toyota', 'RAV4', 2019, 2023, 'engine', 'medium', 'Gas Engine Drone (Hybrid)', 'Hybrid models: engine drones loudly under acceleration. Normal behavior but check for unusual rattles or vibrations.', 'user-reported'),

-- ============================================
-- FORD
-- ============================================

-- Ford F-150 2004-2008 (11th gen)
('Ford', 'F-150', 2004, 2008, 'engine', 'critical', 'Spark Plug Blowout / Breakage', '5.4L Triton V8 spark plugs blow out of cylinder heads or break off inside during removal. Check service history for spark plug replacement. If never done, budget $300-600 per plug.', 'NHTSA'),
('Ford', 'F-150', 2004, 2008, 'engine', 'high', 'Cam Phaser Failure', 'Cam phasers fail causing loud ticking/knocking on startup. Repair costs $2,000-$5,500. Listen for ticking noise on cold start that diminishes as engine warms.', 'TSB'),
('Ford', 'F-150', 2004, 2008, 'engine', 'medium', 'Exhaust Manifold Cracking', 'Exhaust manifolds crack causing ticking noise and exhaust leak. Listen for ticking from engine bay, especially on cold start.', 'CarComplaints.com'),

-- Ford F-150 2009-2014 (12th gen)
('Ford', 'F-150', 2011, 2014, 'engine', 'medium', 'EcoBoost Timing Chain Stretch', '3.5L EcoBoost timing chain stretches causing rough idle and loss of power. Listen for rattling noise from engine. Check engine light may illuminate.', 'TSB'),
('Ford', 'F-150', 2011, 2014, 'engine', 'medium', 'EcoBoost Intercooler Condensation', '3.5L EcoBoost intercooler collects condensation causing engine stumble and misfire on hard acceleration. Test with wide-open throttle acceleration.', 'TSB'),
('Ford', 'F-150', 2009, 2014, 'electrical', 'low', 'Power Window Regulator Failure', 'Power window regulators fail causing windows to drop into door. Test all windows up and down.', 'user-reported'),

-- Ford F-150 2015-2020 (13th gen)
('Ford', 'F-150', 2015, 2020, 'engine', 'high', 'Cam Phaser Tick (EcoBoost)', '3.5L EcoBoost cam phasers fail causing ticking noise on startup. Can lead to timing chain issues. Listen for ticking in first 30 seconds of cold start.', 'NHTSA'),
('Ford', 'F-150', 2018, 2020, 'engine', 'high', '5.0L Oil Consumption', '5.0L V8 burns 1-3 quarts per 1,000 miles. Check oil level on dipstick and look for blue exhaust smoke.', 'Consumer Reports'),
('Ford', 'F-150', 2017, 2020, 'transmission', 'medium', '10-Speed Harsh Shifting', '10-speed automatic shifts harshly, hunts for gears, or clunks during shifts. Test drive with varied acceleration patterns.', 'TSB'),

-- Ford Escape 2008-2012
('Ford', 'Escape', 2008, 2012, 'transmission', 'high', 'Transmission Failure', 'Automatic transmission may fail completely. Check for rough shifting, delayed engagement, or slipping. Test at various speeds.', 'CarComplaints.com'),
('Ford', 'Escape', 2008, 2012, 'engine', 'medium', 'Coolant Leak from Intake Manifold', 'Intake manifold gasket leaks coolant. Check for low coolant level and sweet smell from engine bay.', 'user-reported'),

-- Ford Escape 2013-2019
('Ford', 'Escape', 2013, 2019, 'engine', 'high', '1.6L EcoBoost Coolant Leak / Overheating', '1.6L turbo engine prone to coolant leaks and overheating. Check temperature gauge during test drive and coolant level. Ford issued recall for fire risk on 2013-2014 models.', 'NHTSA'),
('Ford', 'Escape', 2014, 2019, 'transmission', 'medium', 'Transmission Shudder', 'Transmission shudders and vibrates during gear changes, particularly at low speeds. Test in stop-and-go traffic.', 'TSB'),
('Ford', 'Escape', 2013, 2019, 'electrical', 'low', 'Backup Camera Failure', 'Backup camera displays black screen or distorted image. Test in reverse during inspection.', 'user-reported'),

-- ============================================
-- CHEVROLET
-- ============================================

-- Chevrolet Silverado 2007-2013
('Chevrolet', 'Silverado', 2007, 2013, 'engine', 'high', 'AFM Lifter Failure', 'Active Fuel Management (AFM) lifters collapse causing misfires, ticking, and potential engine damage. Listen for ticking noise. Repair costs $2,000-$8,000. Check for misfire codes.', 'NHTSA'),
('Chevrolet', 'Silverado', 2007, 2013, 'engine', 'medium', 'Excessive Oil Consumption (AFM)', 'AFM-equipped 5.3L V8 consumes excessive oil. Check oil level on dipstick — may be low between changes.', 'TSB'),
('Chevrolet', 'Silverado', 2007, 2013, 'electrical', 'medium', 'Instrument Cluster Failure', 'Gauges stop working or give incorrect readings. Speedometer, fuel gauge, and temperature gauge affected. Test all gauges.', 'CarComplaints.com'),

-- Chevrolet Silverado 2014-2018
('Chevrolet', 'Silverado', 2014, 2018, 'engine', 'high', 'AFM Lifter Failure', 'AFM lifter collapse continues in this generation. Listen for ticking or misfires, especially at 80k-150k miles. May trigger check engine light with misfire codes.', 'NHTSA'),
('Chevrolet', 'Silverado', 2014, 2018, 'transmission', 'medium', 'Torque Converter Shudder', 'Transmission shudders at highway speeds due to torque converter clutch slip. Most noticeable at 40-50 mph with light throttle.', 'TSB'),
('Chevrolet', 'Silverado', 2014, 2018, 'body', 'medium', 'Bed Shake / Vibration', 'Truck bed vibrates excessively at highway speeds. Check for loose bed bolts and listen for rattling from truck bed.', 'user-reported'),

-- Chevrolet Silverado 2019-2023
('Chevrolet', 'Silverado', 2019, 2023, 'transmission', 'high', 'Transmission Shudder (8-speed)', 'Shudder/vibration at highway speeds due to torque converter issues in 8-speed transmission. GM issued TSB and extended warranty.', 'TSB'),
('Chevrolet', 'Silverado', 2019, 2023, 'engine', 'high', 'DFM Lifter Failure', 'Dynamic Fuel Management (successor to AFM) lifter failures continue. Listen for ticking and check for misfire codes.', 'NHTSA'),

-- Chevrolet Equinox 2010-2017
('Chevrolet', 'Equinox', 2010, 2013, 'engine', 'critical', 'Excessive Oil Consumption (2.4L Ecotec)', '2.4L Ecotec engine burns more than a quart per 1,000 miles due to defective piston rings. GM class action settlement approved. Check oil level — critically low oil causes engine failure.', 'Class Action'),
('Chevrolet', 'Equinox', 2010, 2017, 'engine', 'high', 'Timing Chain Failure', 'Timing chain stretches and can break causing catastrophic engine damage. Listen for rattling on cold start. Check engine light with timing codes.', 'NHTSA'),
('Chevrolet', 'Equinox', 2010, 2017, 'engine', 'medium', 'Engine Stalling', 'Engine stalls unexpectedly at idle or highway speeds. Potential safety risk. Test extended idle and highway driving.', 'CarComplaints.com'),
('Chevrolet', 'Equinox', 2010, 2017, 'electrical', 'medium', 'Reduced Engine Power Warning', 'Throttle body failure triggers "Engine Power Reduced" warning with severe loss of acceleration. Check for any warning lights.', 'TSB'),

-- ============================================
-- BMW
-- ============================================

-- BMW 3 Series 2006-2011 (E90)
('BMW', '3 Series', 2006, 2011, 'engine', 'high', 'Oil Leaks (Valve Cover & Oil Filter Housing)', 'Valve cover gasket and oil filter housing gasket leak oil onto exhaust causing smoke and fire risk. Check for oil residue around valve cover and smell for burning oil.', 'CarComplaints.com'),
('BMW', '3 Series', 2006, 2011, 'engine', 'medium', 'VANOS Solenoid Failure', 'Variable valve timing solenoids fail causing rough idle, loss of power, and check engine light. Listen for rough idle.', 'user-reported'),
('BMW', '3 Series', 2006, 2011, 'engine', 'medium', 'Water Pump / Thermostat Failure', 'Electric water pump fails without warning causing overheating. Check temperature gauge during extended test drive. Average failure around 60-80k miles.', 'CarComplaints.com'),
('BMW', '3 Series', 2006, 2011, 'electrical', 'low', 'Window Regulator Failure', 'Power window regulators fail causing windows to drop into door. Test all windows up and down.', 'user-reported'),

-- BMW 3 Series 2012-2018 (F30)
('BMW', '3 Series', 2012, 2015, 'engine', 'critical', 'N20 Timing Chain Failure', 'N20 engine timing chain stretches prematurely causing catastrophic engine damage if not caught. Listen for rattling on cold start. Failure can occur as early as 40k miles. Repair costs $3,000-$5,000.', 'NHTSA'),
('BMW', '3 Series', 2012, 2018, 'engine', 'high', 'Oil Leaks (Valve Cover & Oil Pan)', 'Valve cover and oil pan gaskets leak. Look for oil drips under the car and oil residue on engine.', 'CarComplaints.com'),
('BMW', '3 Series', 2012, 2018, 'electrical', 'medium', 'Battery Drain / Module Sleep Issues', 'Modules fail to enter sleep mode causing excessive battery drain when parked. Battery may die overnight. Check battery age and voltage.', 'user-reported'),
('BMW', '3 Series', 2012, 2018, 'engine', 'medium', 'Coolant Loss / Expansion Tank Crack', 'Coolant expansion tank cracks causing coolant loss and overheating. Check coolant level and inspect tank for cracks or white residue.', 'user-reported'),

-- ============================================
-- NISSAN
-- ============================================

-- Nissan Altima 2007-2012
('Nissan', 'Altima', 2007, 2012, 'transmission', 'critical', 'CVT Transmission Failure', 'CVT transmission fails causing shuddering, jerking, loss of acceleration, and complete failure. Nissan extended warranty to 10yr/120k miles for 2007-2010 models. Test drive extensively — check for shudder, hesitation, and whining noise.', 'NHTSA'),
('Nissan', 'Altima', 2007, 2012, 'engine', 'medium', 'Excessive Oil Consumption', 'Engine consumes oil at abnormal rate. Check oil level on dipstick before and after test drive.', 'Consumer Reports'),
('Nissan', 'Altima', 2007, 2012, 'body', 'low', 'Rust on Rear Subframe', 'Rear subframe and control arms rust prematurely, especially in salt belt states. Inspect undercarriage for rust.', 'user-reported'),

-- Nissan Altima 2013-2018
('Nissan', 'Altima', 2013, 2018, 'transmission', 'high', 'CVT Shudder and Hesitation', 'CVT exhibits shuddering, jerking, delayed acceleration, and overheating. Class action settlements for 2013-2018 models. Test drive in city traffic with varied acceleration.', 'Class Action'),
('Nissan', 'Altima', 2013, 2018, 'engine', 'medium', 'Engine Stalling', 'Engine stalls at low speeds or idle. Potential safety hazard in traffic. Test extended idling and slow-speed driving.', 'NHTSA'),

-- Nissan Rogue 2014-2020
('Nissan', 'Rogue', 2014, 2020, 'transmission', 'high', 'CVT Transmission Problems', 'CVT overheats and fails, especially in warm climates or during prolonged driving. Symptoms include whining, shuddering, and sudden loss of power. Test drive for at least 15 minutes.', 'NHTSA'),
('Nissan', 'Rogue', 2014, 2020, 'electrical', 'medium', 'Emergency Braking False Activation', 'Automatic emergency braking system activates without obstruction, causing sudden unexpected stops. Test drive on a clear road.', 'NHTSA'),
('Nissan', 'Rogue', 2014, 2020, 'other', 'low', 'AC Compressor Failure', 'AC compressor fails requiring expensive replacement. Test AC at full cold during inspection.', 'user-reported'),

-- ============================================
-- HYUNDAI
-- ============================================

-- Hyundai Elantra 2011-2016
('Hyundai', 'Elantra', 2011, 2016, 'engine', 'critical', 'Theta II Engine Seizure', '2.0L engine may seize due to manufacturing defect — metal shavings restrict oil flow. Hyundai extended warranty to 15yr/150k miles. Listen for knocking noise and check if recall/update has been performed.', 'NHTSA'),
('Hyundai', 'Elantra', 2011, 2016, 'electrical', 'medium', 'Airbag Warning Light', 'Airbag warning light illuminates due to faulty clock spring. Check for illuminated airbag light on dashboard.', 'TSB'),
('Hyundai', 'Elantra', 2011, 2016, 'other', 'low', 'Steering Coupler Noise', 'Clunking noise when turning steering wheel due to worn steering coupler. Turn wheel side to side while parked and listen for clunk.', 'user-reported'),

-- Hyundai Elantra 2017-2020
('Hyundai', 'Elantra', 2017, 2020, 'engine', 'high', 'Engine Bearing Failure (Nu/Gamma)', 'Engine may develop bearing failure causing seizure. Hyundai recall and warranty extension apply. Listen for knocking noise from engine.', 'NHTSA'),
('Hyundai', 'Elantra', 2017, 2020, 'electrical', 'low', 'Infotainment Screen Failure', 'Touchscreen goes blank or becomes unresponsive. Test all infotainment functions during inspection.', 'user-reported'),

-- Hyundai Sonata 2011-2014
('Hyundai', 'Sonata', 2011, 2014, 'engine', 'critical', 'Theta II Engine Seizure', '2.0L and 2.4L Theta II engines seize due to connecting rod bearing failure from metal debris in oil passages. $1.3B class action settlement. Warranty extended to 15yr/150k miles. Listen for rod knock.', 'NHTSA'),
('Hyundai', 'Sonata', 2011, 2014, 'engine', 'high', 'Excessive Oil Consumption', 'Engine consumes oil rapidly. Check oil level — if low between changes, engine damage may be imminent. Related to Theta II defect.', 'Consumer Reports'),
('Hyundai', 'Sonata', 2011, 2014, 'electrical', 'medium', 'Steering Lock Malfunction', 'Electronic steering lock malfunctions preventing vehicle from starting. Check for steering lock warning on dash.', 'NHTSA'),

-- Hyundai Sonata 2015-2019
('Hyundai', 'Sonata', 2015, 2019, 'engine', 'high', 'Engine Recall (Theta II Continued)', 'Theta II engine issues continue. Knock sensor detection system software update required. Verify recall completion and listen for engine knock.', 'NHTSA'),
('Hyundai', 'Sonata', 2015, 2019, 'engine', 'medium', 'Piston Ring / Oil Consumption', 'Piston rings fail causing excessive oil consumption. Check oil level on dipstick.', 'TSB'),

-- ============================================
-- KIA
-- ============================================

-- Kia Optima 2011-2015
('Kia', 'Optima', 2011, 2015, 'engine', 'critical', 'Theta II Engine Seizure', 'Same Theta II engine as Hyundai Sonata — seizes due to connecting rod bearing failure. Part of $1.3B settlement. Warranty extended to 15yr/150k miles. Listen for knocking and check recall status.', 'NHTSA'),
('Kia', 'Optima', 2011, 2015, 'engine', 'high', 'Excessive Oil Consumption', 'Engine burns oil rapidly due to piston ring defect. Check oil level on dipstick — low oil causes engine seizure.', 'Consumer Reports'),
('Kia', 'Optima', 2011, 2015, 'safety', 'medium', 'Steering Column Lock', 'Electronic steering column lock malfunctions, preventing vehicle from starting. Check for warning lights related to steering.', 'NHTSA'),

-- Kia Optima 2016-2020
('Kia', 'Optima', 2016, 2020, 'engine', 'high', 'Engine Bearing Failure', 'Theta II engine bearing failure continues in this generation. Kia issued recalls and software updates. Listen for engine knocking and verify recall completion.', 'NHTSA'),
('Kia', 'Optima', 2016, 2020, 'electrical', 'medium', 'Battery Drain', 'Battery drains overnight due to parasitic electrical draw. Check battery voltage and age.', 'user-reported'),

-- ============================================
-- SUBARU
-- ============================================

-- Subaru Outback 2010-2014
('Subaru', 'Outback', 2010, 2014, 'engine', 'high', 'Excessive Oil Consumption', 'Both 2.5L and 3.6L engines consume oil excessively due to piston ring defect. Subaru class action resulted in 8yr/100k mile warranty. Check oil level on dipstick before and after test drive.', 'Class Action'),
('Subaru', 'Outback', 2010, 2014, 'transmission', 'high', 'CVT Failure / Shudder', 'CVT transmission slips, shudders, or fails completely. Subaru extended CVT warranty to 10yr/100k miles. Test drive for shudder, hesitation, and whining noise during acceleration.', 'TSB'),
('Subaru', 'Outback', 2010, 2014, 'engine', 'medium', 'Head Gasket Leak', 'Head gaskets may leak coolant externally. Check for coolant residue around cylinder heads and sweet smell from engine bay. Check coolant level.', 'CarComplaints.com'),

-- Subaru Outback 2015-2019
('Subaru', 'Outback', 2015, 2019, 'engine', 'medium', 'Excessive Oil Consumption (2.5L)', '2.5L engine may still consume oil, though improved from prior generation. Check oil level on dipstick.', 'Consumer Reports'),
('Subaru', 'Outback', 2015, 2019, 'electrical', 'medium', 'Starlink Infotainment Issues', 'Infotainment system freezes, crashes, or has slow response. Test all screen functions and Bluetooth pairing.', 'user-reported'),
('Subaru', 'Outback', 2015, 2019, 'body', 'low', 'Windshield Cracking', 'Windshields crack easily, possibly due to body flex. Inspect for existing cracks.', 'user-reported'),

-- ============================================
-- JEEP
-- ============================================

-- Jeep Wrangler 2007-2018
('Jeep', 'Wrangler', 2007, 2018, 'safety', 'critical', 'Death Wobble', 'Violent steering oscillation at highway speeds after hitting a bump. Caused by worn track bar, tie rod ends, and/or ball joints. Test drive at 55+ mph over bumps. Grab front wheels and check for play.', 'NHTSA'),
('Jeep', 'Wrangler', 2007, 2011, 'engine', 'medium', '3.8L EVAP System Leaks', '3.8L V6 engine prone to EVAP system leaks causing check engine light. Check for gas cap warnings or check engine light.', 'user-reported'),
('Jeep', 'Wrangler', 2012, 2018, 'engine', 'medium', '3.6L Oil Cooler / Head Leak', '3.6L Pentastar engine may develop oil cooler housing leaks or cylinder head cracks. Check for oil leaks around engine and look for coolant-oil mixing.', 'TSB'),
('Jeep', 'Wrangler', 2007, 2018, 'body', 'medium', 'Hardtop / Freedom Panel Leaks', 'Water leaks around hardtop seals and freedom panels. Check headliner for water stains and test by running water over roof.', 'user-reported'),

-- Jeep Grand Cherokee 2011-2021
('Jeep', 'Grand Cherokee', 2011, 2021, 'safety', 'high', 'Death Wobble', 'Same violent steering oscillation as Wrangler at highway speeds. Check all front-end components for wear and play. Test drive at highway speed over bumps.', 'NHTSA'),
('Jeep', 'Grand Cherokee', 2011, 2015, 'electrical', 'high', 'TIPM Electrical Failure', 'Totally Integrated Power Module fails causing fuel pump shutoff, starter issues, random horn honking, and window malfunctions. Test all electrical systems.', 'NHTSA'),
('Jeep', 'Grand Cherokee', 2014, 2021, 'engine', 'medium', '3.6L Oil Cooler Leak', 'Pentastar 3.6L oil cooler housing leaks oil. Check for oil residue under vehicle and around engine. Monitor oil level.', 'TSB'),
('Jeep', 'Grand Cherokee', 2011, 2021, 'electrical', 'low', 'Uconnect Freezing / Rebooting', 'Infotainment system freezes and reboots during driving. Test all infotainment functions during inspection.', 'user-reported'),

-- ============================================
-- TESLA
-- ============================================

-- Tesla Model 3 2017-2023
('Tesla', 'Model 3', 2017, 2023, 'body', 'medium', 'Panel Gap Inconsistency', 'Inconsistent panel gaps between body panels, doors, trunk, and hood. Visually inspect all panel gaps and run finger along edges to feel for misalignment.', 'Consumer Reports'),
('Tesla', 'Model 3', 2017, 2023, 'other', 'high', 'Front Suspension Noise', 'Upper control arm ball joints wear out or seize causing squeaking, creaking, or clunking when turning or hitting bumps. Listen for noise during low-speed turns and over bumps.', 'CarComplaints.com'),
('Tesla', 'Model 3', 2017, 2023, 'safety', 'medium', 'Phantom Braking', 'Sudden unexpected braking events on highways, particularly near overpasses and shadows. NHTSA investigation opened. Test drive on highway.', 'NHTSA'),
('Tesla', 'Model 3', 2017, 2021, 'body', 'low', 'Trim and Seal Quality', 'Door seals, window trim, and interior panels may be loose or poorly fitted. Check all door seals and interior trim attachment.', 'user-reported'),

-- Tesla Model Y 2020-2023
('Tesla', 'Model Y', 2020, 2023, 'body', 'medium', 'Panel Gap / Build Quality', 'Panel gaps, paint defects, and misaligned body panels common, especially early production. Inspect all body panel alignment in good lighting.', 'Consumer Reports'),
('Tesla', 'Model Y', 2020, 2023, 'other', 'high', 'Front Suspension Clunking', 'Front suspension lateral links and compliance links develop torn bushings causing clunking and squeaking. Listen during low-speed turns and over bumps.', 'CarComplaints.com'),
('Tesla', 'Model Y', 2020, 2023, 'safety', 'medium', 'Phantom Braking', 'Same phantom braking issue as Model 3 on highways near overpasses. Test drive on highway.', 'NHTSA'),
('Tesla', 'Model Y', 2020, 2023, 'electrical', 'medium', 'Touchscreen / MCU Issues', 'Main touchscreen may yellow, develop dead zones, or fail. Test all screen areas and check for discoloration.', 'NHTSA'),

-- ============================================
-- MAZDA
-- ============================================

-- Mazda3 2010-2013
('Mazda', 'Mazda3', 2010, 2013, 'transmission', 'high', 'Premature Clutch Failure (Manual)', 'Clutch components wear out prematurely, sometimes before 50k miles. Class action filed. Check clutch pedal feel — high engagement point or slipping indicates wear. Test on hills.', 'Class Action'),
('Mazda', 'Mazda3', 2010, 2013, 'body', 'medium', 'Rust on Subframe and Wheel Arches', 'Premature rust on subframe, wheel arches, and undercarriage. Thoroughly inspect underside, especially in salt belt states. Check wheel arch lips.', 'CarComplaints.com'),
('Mazda', 'Mazda3', 2010, 2013, 'engine', 'low', 'Engine Mount Wear', 'Engine mounts wear causing vibration at idle. Feel for excessive vibration through steering wheel and seats while in Drive at a stop.', 'user-reported'),

-- Mazda3 2014-2018
('Mazda', 'Mazda3', 2014, 2018, 'electrical', 'medium', 'Infotainment Screen Issues', 'Mazda Connect touchscreen freezes, delaminates, or becomes unresponsive. Backup camera may intermittently fail. Test all screen functions.', 'user-reported'),
('Mazda', 'Mazda3', 2014, 2018, 'body', 'medium', 'Rust on Undercarriage', 'Rust on subframe and suspension components continues in this generation. Inspect undercarriage carefully.', 'CarComplaints.com'),
('Mazda', 'Mazda3', 2014, 2018, 'engine', 'low', 'Carbon Buildup (Skyactiv)', 'Direct injection Skyactiv engines may develop carbon buildup on intake valves. Check for rough idle or hesitation.', 'user-reported'),

-- ============================================
-- VOLKSWAGEN
-- ============================================

-- VW Jetta/Golf 2009-2014
('Volkswagen', 'Jetta', 2009, 2012, 'engine', 'critical', 'Timing Chain Tensioner Failure', 'Timing chain tensioner fails causing timing to jump and catastrophic engine damage. "Death rattle" on cold start is the warning sign. Failure can occur as early as 10k miles. Full engine replacement often needed.', 'NHTSA'),
('Volkswagen', 'Golf', 2009, 2012, 'engine', 'critical', 'Timing Chain Tensioner Failure', 'Same tensioner failure as Jetta. Listen for rattling on cold startup, especially in winter. Redesigned tensioner fitted from ~2012. Verify if updated part was installed.', 'NHTSA'),
('Volkswagen', 'Jetta', 2009, 2014, 'transmission', 'medium', 'DSG Mechatronic Failure', 'DSG dual-clutch transmission exhibits jerky shifts, hesitation, and mechatronic unit failure in stop-and-go driving. Test in city traffic with frequent stops.', 'TSB'),
('Volkswagen', 'Golf', 2009, 2014, 'transmission', 'medium', 'DSG Mechatronic Failure', 'Same DSG issues as Jetta. Jerky low-speed shifts and hesitation indicate mechatronic problems. Verify DSG fluid service history.', 'TSB'),
('Volkswagen', 'Jetta', 2009, 2014, 'electrical', 'low', 'Window Regulator Failure', 'Power window regulators fail. Test all windows up and down during inspection.', 'user-reported'),

-- VW Jetta/Golf 2015-2019
('Volkswagen', 'Jetta', 2015, 2019, 'engine', 'medium', 'Carbon Buildup (TSI)', 'Direct injection TSI engines develop carbon buildup on intake valves causing rough idle and misfires. Check for rough idle and hesitation.', 'user-reported'),
('Volkswagen', 'Golf', 2015, 2019, 'engine', 'medium', 'Water Pump Failure', 'Water pump fails causing coolant leak and overheating. Check coolant level and look for leaks around water pump area.', 'CarComplaints.com'),
('Volkswagen', 'Jetta', 2015, 2019, 'electrical', 'low', 'Infotainment Glitches', 'Touchscreen freezes or CarPlay/Android Auto disconnects. Test all connectivity features.', 'user-reported'),

-- ============================================
-- MINI
-- ============================================

-- Mini Cooper/Clubman 2007-2013
('Mini', 'Cooper', 2007, 2013, 'engine', 'critical', 'Timing Chain Tensioner Failure', 'Timing chain tensioner fails causing chain to jump timing and engine damage. Common at 20-30k miles — far earlier than typical. Listen for loud rattle on cold start. Recall issued for some models.', 'NHTSA'),
('Mini', 'Clubman', 2007, 2013, 'engine', 'critical', 'Timing Chain Tensioner Failure', 'Same tensioner failure as Cooper. Turbocharged 1.6L engine especially affected. Listen for rattle on cold start and verify if recall/repair was completed.', 'NHTSA'),
('Mini', 'Cooper', 2007, 2013, 'engine', 'high', 'Thermostat / Water Pump Failure', 'Electric thermostat and water pump fail causing overheating. Can cause severe engine damage. Monitor temp gauge during test drive and check coolant level.', 'CarComplaints.com'),
('Mini', 'Clubman', 2007, 2013, 'engine', 'high', 'Thermostat / Water Pump Failure', 'Same cooling system failures as Cooper. Check for coolant leaks, overheating, and coolant level.', 'CarComplaints.com'),
('Mini', 'Cooper', 2007, 2013, 'transmission', 'medium', 'Premature Clutch Wear (Manual)', 'Manual transmission clutch wears out prematurely, especially Cooper S. Check clutch engagement point — high or slipping indicates wear.', 'user-reported'),
('Mini', 'Clubman', 2007, 2013, 'transmission', 'medium', 'Premature Clutch Wear (Manual)', 'Same clutch issues as Cooper. Test clutch on hills and during firm acceleration.', 'user-reported'),
('Mini', 'Cooper', 2007, 2013, 'electrical', 'medium', 'Power Steering Pump Failure', 'Electric power steering pump fails causing heavy steering. Turn wheel side to side at low speed to check for difficulty or whining noise.', 'TSB'),
('Mini', 'Clubman', 2007, 2013, 'electrical', 'medium', 'Power Steering Pump Failure', 'Same power steering issue as Cooper. Whining noise and heavy steering are warning signs.', 'TSB'),

-- ============================================
-- DODGE/RAM
-- ============================================

-- Dodge RAM 1500 2009-2018
('Dodge', 'RAM 1500', 2009, 2018, 'engine', 'high', 'Hemi Tick / Exhaust Manifold Bolts', '5.7L Hemi exhaust manifold bolts break causing ticking noise and exhaust leak. Ticking is loudest on cold start and may diminish as engine warms. Warped manifold puts strain on bolts.', 'CarComplaints.com'),
('Dodge', 'RAM 1500', 2009, 2018, 'electrical', 'critical', 'TIPM (Totally Integrated Power Module) Failure', 'TIPM develops cold solder joints causing random electrical failures — fuel pump shutoff, horn honking, windows operating on their own. Airbags may not deploy. Test all electrical systems thoroughly.', 'NHTSA'),
('Dodge', 'RAM 1500', 2009, 2018, 'engine', 'medium', 'Hemi Lifter / Cam Failure', 'Hydraulic lifters and camshaft fail in 5.7L Hemi causing ticking, misfires, and potential engine damage. Listen for persistent ticking that does not go away when engine warms.', 'TSB'),
('Dodge', 'RAM 1500', 2009, 2018, 'transmission', 'medium', 'Torque Converter Shudder', 'Transmission shudders at light throttle and highway speeds due to torque converter clutch issues. Test drive at 40-55 mph with light acceleration.', 'TSB'),
('Dodge', 'RAM 1500', 2013, 2018, 'other', 'low', 'Interior Trim Quality', 'Dashboard, door panels, and interior trim pieces rattle and come loose. Check for rattles on rough roads and inspect trim attachment.', 'user-reported');
