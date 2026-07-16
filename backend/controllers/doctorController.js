import Doctor from '../models/Doctor.js';
import Specialty from '../models/Specialty.js';
import Region from '../models/Region.js';
import Province from '../models/Province.js';
import City from '../models/City.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';
const { isValidObjectId } = mongoose;

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Check if Cloudinary is configured with real credentials (not test/empty)
const isCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return cloud_name && api_key && api_secret && 
         cloud_name !== 'test' && api_key !== 'test' && api_secret !== 'test' &&
         cloud_name.length > 3;
};

// Upload image to Cloudinary or return null if not configured
const uploadDoctorImage = async (file) => {
  if (!isCloudinaryConfigured()) {
    console.warn('⚠️  Cloudinary not configured — skipping image upload. Set real CLOUDINARY_* credentials in .env');
    return null;
  }
  const b64 = Buffer.from(file.buffer).toString('base64');
  const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
  const result = await cloudinary.uploader.upload(dataURI, { folder: 'capsandpills/doctors' });
  return result.secure_url;
};

const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const afterUpload = parts.slice(uploadIndex + 1);
    const startIndex = afterUpload[0]?.startsWith('v') ? 1 : 0;
    return afterUpload.slice(startIndex).join('/').replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

const deleteCloudinaryImage = async (url) => {
  if (!url || !isCloudinaryConfigured()) return;
  try {
    const publicId = getCloudinaryPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Failed to delete Cloudinary image:', error.message);
  }
};

// ───────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ───────────────────────────────────────────────

export const getDoctors = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      specialty,
      region,
      province,
      city,
      hospital,
      teleconsultation,
      verified,
      emergency,
      sort,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      const safeSearch = String(search).slice(0, 100);
      query.$text = { $search: safeSearch };
    }
    if (specialty && isValidObjectId(specialty)) query.specialty = specialty;
    if (region && isValidObjectId(region)) query.region = region;
    if (province && isValidObjectId(province)) query.province = province;
    if (city && isValidObjectId(city)) query.city = city;
    if (hospital) query.hospitalClinic = new RegExp(escapeRegex(hospital), 'i');
    if (teleconsultation === 'true') query.teleconsultation = true;
    if (verified === 'true') query.isVerified = true;
    if (emergency === 'true') query.isEmergency = true;

    let sortOption = {};
    if (sort === 'rating') sortOption = { rating: -1, numReviews: -1 };
    else if (sort === 'experience') sortOption = { yearsOfExperience: -1 };
    else if (sort === 'name') sortOption = { name: 1 };
    else sortOption = { isFeatured: -1, rating: -1, createdAt: -1 }; // default

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const pageLimit = Math.max(1, Math.min(100, Number(limit)));

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate('specialty', 'name slug')
        .populate('region', 'name slug')
        .populate('province', 'name slug')
        .populate('city', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    const pages = Math.max(1, Math.ceil(total / pageLimit));

    res.json({
      success: true,
      doctors,
      pagination: { page: Number(page), limit: pageLimit, total, pages },
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorBySlug = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ slug: req.params.slug, isActive: true })
      .populate('specialty', 'name slug')
      .populate('region', 'name slug')
      .populate('province', 'name slug')
      .populate('city', 'name slug');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Get related doctors: same specialty, same city, different doctor
    const related = await Doctor.find({
      _id: { $ne: doctor._id },
      specialty: doctor.specialty,
      isActive: true,
    })
      .populate('specialty', 'name slug')
      .populate('city', 'name slug')
      .sort({ rating: -1 })
      .limit(4)
      .lean();

    res.json({ success: true, doctor, relatedDoctors: related });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isFeatured: true, isActive: true })
      .populate('specialty', 'name slug')
      .populate('city', 'name slug')
      .sort({ rating: -1 })
      .limit(8)
      .lean();
    res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isEmergency: true, isActive: true })
      .populate('specialty', 'name slug')
      .populate('city', 'name slug')
      .sort({ rating: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
};

export const getSpecialties = async (req, res, next) => {
  try {
    const specialties = await Specialty.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, specialties });
  } catch (error) {
    next(error);
  }
};

export const getRegions = async (req, res, next) => {
  try {
    const regions = await Region.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, regions });
  } catch (error) {
    next(error);
  }
};

export const getProvincesByRegion = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.regionId)) {
      return res.status(400).json({ success: false, message: 'Invalid region ID' });
    }
    const provinces = await Province.find({ region: req.params.regionId, isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();
    res.json({ success: true, provinces });
  } catch (error) {
    next(error);
  }
};

export const getCitiesByProvince = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.provinceId)) {
      return res.status(400).json({ success: false, message: 'Invalid province ID' });
    }
    const cities = await City.find({ province: req.params.provinceId, isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();
    res.json({ success: true, cities });
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────
// ADMIN ENDPOINTS
// ───────────────────────────────────────────────

export const getAllDoctorsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { name: new RegExp(safe, 'i') },
        { hospitalClinic: new RegExp(safe, 'i') },
      ];
    }
    const isExport = req.query.export === 'true';
    const pageNum = Math.max(1, Number(page));
    const pageLimit = isExport ? 10000 : Math.max(1, Math.min(100, Number(limit)));
    const skip = isExport ? 0 : (pageNum - 1) * pageLimit;

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate('specialty', 'name')
        .populate('region', 'name')
        .populate('province', 'name')
        .populate('city', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    const pages = Math.max(1, Math.ceil(total / pageLimit));
    res.json({ success: true, doctors, pagination: { page: pageNum, limit: pageLimit, total, pages } });
  } catch (error) {
    next(error);
  }
};

const normalizeDoctorData = (body) => {
  const data = { ...body };
  // Parse JSON arrays
  if (data.availableDays) {
    try {
      const parsed = JSON.parse(data.availableDays);
      data.availableDays = Array.isArray(parsed) ? parsed : [];
    } catch {
      data.availableDays = [];
    }
  }
  // Parse booleans from string
  ['teleconsultation', 'isVerified', 'isFeatured', 'isEmergency', 'isActive'].forEach((key) => {
    if (typeof data[key] === 'string') {
      data[key] = data[key] === 'true';
    }
  });
  // Parse numbers
  if (data.consultationFee) data.consultationFee = Number(data.consultationFee);
  if (data.yearsOfExperience) data.yearsOfExperience = Number(data.yearsOfExperience);
  if (data.order) data.order = Number(data.order);
  return data;
};

export const createDoctor = async (req, res, next) => {
  try {
    const doctorData = normalizeDoctorData(req.body);
    if (req.file) {
      if (doctorData.profilePhoto) {
        await deleteCloudinaryImage(doctorData.profilePhoto);
      }
      const photoUrl = await uploadDoctorImage(req.file);
      if (photoUrl) doctorData.profilePhoto = photoUrl;
    }
    const doctor = await Doctor.create(doctorData);
    await doctor.populate([
      { path: 'specialty', select: 'name slug' },
      { path: 'region', select: 'name slug' },
      { path: 'province', select: 'name slug' },
      { path: 'city', select: 'name slug' },
    ]);
    res.status(201).json({ success: true, message: 'Doctor created', doctor });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const existingDoctor = await Doctor.findById(req.params.id);
    if (!existingDoctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorData = normalizeDoctorData(req.body);
    if (req.file) {
      if (existingDoctor.profilePhoto) {
        await deleteCloudinaryImage(existingDoctor.profilePhoto);
      }
      const photoUrl = await uploadDoctorImage(req.file);
      if (photoUrl) doctorData.profilePhoto = photoUrl;
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, doctorData, { new: true, runValidators: true })
      .populate('specialty', 'name slug')
      .populate('region', 'name slug')
      .populate('province', 'name slug')
      .populate('city', 'name slug');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, message: 'Doctor updated', doctor });
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    if (doctor.profilePhoto) {
      await deleteCloudinaryImage(doctor.profilePhoto);
    }
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Specialties CRUD ───

export const getAllSpecialtiesAdmin = async (req, res, next) => {
  try {
    const specialties = await Specialty.find().sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, specialties });
  } catch (error) {
    next(error);
  }
};

export const createSpecialty = async (req, res, next) => {
  try {
    const specialty = await Specialty.create(req.body);
    res.status(201).json({ success: true, message: 'Specialty created', specialty });
  } catch (error) {
    next(error);
  }
};

export const updateSpecialty = async (req, res, next) => {
  try {
    const specialty = await Specialty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!specialty) return res.status(404).json({ success: false, message: 'Specialty not found' });
    res.json({ success: true, message: 'Specialty updated', specialty });
  } catch (error) {
    next(error);
  }
};

export const deleteSpecialty = async (req, res, next) => {
  try {
    const doctorCount = await Doctor.countDocuments({ specialty: req.params.id });
    if (doctorCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${doctorCount} doctor(s) use this specialty` });
    }
    const specialty = await Specialty.findByIdAndDelete(req.params.id);
    if (!specialty) return res.status(404).json({ success: false, message: 'Specialty not found' });
    res.json({ success: true, message: 'Specialty deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Regions CRUD ───

export const getAllRegionsAdmin = async (req, res, next) => {
  try {
    const regions = await Region.find().sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, regions });
  } catch (error) {
    next(error);
  }
};

export const createRegion = async (req, res, next) => {
  try {
    const region = await Region.create(req.body);
    res.status(201).json({ success: true, message: 'Region created', region });
  } catch (error) {
    next(error);
  }
};

export const updateRegion = async (req, res, next) => {
  try {
    const region = await Region.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!region) return res.status(404).json({ success: false, message: 'Region not found' });
    res.json({ success: true, message: 'Region updated', region });
  } catch (error) {
    next(error);
  }
};

export const deleteRegion = async (req, res, next) => {
  try {
    const provinceCount = await Province.countDocuments({ region: req.params.id });
    if (provinceCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${provinceCount} province(s) linked to this region` });
    }
    const region = await Region.findByIdAndDelete(req.params.id);
    if (!region) return res.status(404).json({ success: false, message: 'Region not found' });
    res.json({ success: true, message: 'Region deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Provinces CRUD ───

export const getAllProvincesAdmin = async (req, res, next) => {
  try {
    const provinces = await Province.find().populate('region', 'name').sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, provinces });
  } catch (error) {
    next(error);
  }
};

export const createProvince = async (req, res, next) => {
  try {
    const province = await Province.create(req.body);
    await province.populate('region', 'name');
    res.status(201).json({ success: true, message: 'Province created', province });
  } catch (error) {
    next(error);
  }
};

export const updateProvince = async (req, res, next) => {
  try {
    const province = await Province.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!province) return res.status(404).json({ success: false, message: 'Province not found' });
    res.json({ success: true, message: 'Province updated', province });
  } catch (error) {
    next(error);
  }
};

export const deleteProvince = async (req, res, next) => {
  try {
    const cityCount = await City.countDocuments({ province: req.params.id });
    if (cityCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${cityCount} city(s) linked to this province` });
    }
    const province = await Province.findByIdAndDelete(req.params.id);
    if (!province) return res.status(404).json({ success: false, message: 'Province not found' });
    res.json({ success: true, message: 'Province deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Cities CRUD ───

export const getAllCitiesAdmin = async (req, res, next) => {
  try {
    const cities = await City.find()
      .populate('region', 'name')
      .populate('province', 'name')
      .sort({ order: 1, name: 1 })
      .lean();
    res.json({ success: true, cities });
  } catch (error) {
    next(error);
  }
};

export const createCity = async (req, res, next) => {
  try {
    const city = await City.create(req.body);
    await city.populate([
      { path: 'region', select: 'name' },
      { path: 'province', select: 'name' },
    ]);
    res.status(201).json({ success: true, message: 'City created', city });
  } catch (error) {
    next(error);
  }
};

export const updateCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    res.json({ success: true, message: 'City updated', city });
  } catch (error) {
    next(error);
  }
};

export const deleteCity = async (req, res, next) => {
  try {
    const doctorCount = await Doctor.countDocuments({ city: req.params.id });
    if (doctorCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${doctorCount} doctor(s) linked to this city` });
    }
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    res.json({ success: true, message: 'City deleted' });
  } catch (error) {
    next(error);
  }
};
