"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const attendance_service_1 = require("./attendance.service");
const platform_express_1 = require("@nestjs/platform-express");
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    lastEventPayload = null;
    lastImageDataUrl = null;
    lastUpdatedAt = null;
    checkIn(req, res, files = [], body) {
        const b = body || {};
        const ct = req.headers['content-type'];
        const bodyType = body === null ? 'null' : typeof body;
        const isArray = Array.isArray(body);
        const ctor = body?.constructor?.name;
        const raw = req.rawBody;
        const rawType = raw === undefined ? 'undefined' : (raw === null ? 'null' : typeof raw);
        try {
            console.log('FaceID check-in headers content-type:', ct);
            console.log('FaceID check-in body type:', bodyType, 'isArray:', isArray, 'ctor:', ctor);
            console.log('FaceID check-in body preview:', bodyType === 'string' ? body.slice(0, 200) : JSON.stringify(body)?.slice(0, 500));
            console.log('FaceID check-in rawBody type:', rawType, 'preview:', rawType === 'string' ? String(raw).slice(0, 200) : rawType === 'object' ? JSON.stringify(raw)?.slice(0, 200) : rawType);
            const isMultipart = ct && String(ct).includes('multipart/form-data');
            if (isMultipart) {
                const fieldKeys = body && typeof body === 'object' ? Object.keys(body) : [];
                console.log('FaceID check-in multipart fields:', fieldKeys);
                for (const key of fieldKeys) {
                    const val = body[key];
                    const valType = val === null ? 'null' : typeof val;
                    const looksLikeXml = valType === 'string' && /^\s*</.test(val);
                    if (looksLikeXml) {
                        const parsed = this.tryParseXml(val);
                        console.log(`Field ${key} appears XML. Parsed JSON preview:`, JSON.stringify(parsed).slice(0, 800));
                    }
                    else {
                        console.log(`Field ${key} (${valType}) preview:`, valType === 'string' ? String(val).slice(0, 200) : JSON.stringify(val)?.slice(0, 200));
                    }
                }
                const f = Array.isArray(files) ? files : [];
                console.log('FaceID check-in files count:', f.length);
                for (const file of f) {
                    const name = file.originalname;
                    const mime = file.mimetype;
                    console.log('File:', { name, mime, size: file.size });
                    const isXml = (mime && (mime.includes('xml') || mime === 'text/plain')) || (name && name.toLowerCase().endsWith('.xml'));
                    if (isXml) {
                        try {
                            const xmlText = file.buffer?.toString('utf8') ?? (file.path ? fs.readFileSync(file.path, 'utf8') : undefined);
                            const parsed = this.tryParseXml(xmlText);
                            console.log('XML file parsed to JSON preview:', JSON.stringify(parsed).slice(0, 1200));
                        }
                        catch (e) {
                            console.log('Failed to parse XML file:', e);
                        }
                    }
                }
                try {
                    const rawEventLog = body?.event_log;
                    let parsedEvent = null;
                    if (typeof rawEventLog === 'string') {
                        try {
                            parsedEvent = JSON.parse(rawEventLog);
                        }
                        catch { }
                    }
                    else if (typeof rawEventLog === 'object' && rawEventLog) {
                        parsedEvent = rawEventLog;
                    }
                    const imageFile = f.find(file => (file.mimetype || '').startsWith('image/'));
                    let imgSrc = '';
                    if (imageFile) {
                        try {
                            const mime = imageFile.mimetype || 'image/jpeg';
                            const b64 = imageFile.buffer ? imageFile.buffer.toString('base64') : (imageFile.path ? fs.readFileSync(imageFile.path).toString('base64') : '');
                            if (b64)
                                imgSrc = `data:${mime};base64,${b64}`;
                        }
                        catch { }
                    }
                    this.lastEventPayload = parsedEvent ?? rawEventLog ?? null;
                    this.lastImageDataUrl = imgSrc || null;
                    this.lastUpdatedAt = new Date().toISOString();
                    const html = `<!doctype html>
          <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>FaceID Check-In Preview</title>
            <style>
              body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; margin:16px;}
              .wrap{max-width:900px;margin:0 auto}
              pre{background:#0f172a; color:#e2e8f0; padding:12px; border-radius:8px; overflow:auto}
              .img{margin-top:16px}
              img{max-width:100%;height:auto;border-radius:8px;border:1px solid #e5e7eb}
              .meta{color:#334155;margin-bottom:8px}
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="meta">content-type: ${String(ct)}</div>
              <h2>FaceID Check-In</h2>
              <h3>event_log</h3>
              <pre>${parsedEvent ? JSON.stringify(parsedEvent, null, 2) : (typeof rawEventLog === 'string' ? rawEventLog.replace(/</g, '&lt;') : 'No event_log')}</pre>
              ${imgSrc ? `<div class="img"><h3>Picture</h3><img src="${imgSrc}" alt="Picture"/></div>` : ''}
            </div>
          </body>
          </html>`;
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    return res.status(200).send(html);
                }
                catch (e) {
                    console.log('HTML preview build error:', e);
                }
            }
        }
        catch (e) {
            console.log('FaceID check-in log error:', e);
        }
        return this.attendanceService.checkIn({
            userId: b.userId,
            faceTemplateId: b.faceTemplateId,
            branchId: b.branchId,
            deviceId: b.deviceId,
            similarity: b.similarity,
            payload: b.payload,
        });
    }
    checkOut(req, res, files = [], body) {
        const ct = req.headers['content-type'];
        const bodyType = body === null ? 'null' : typeof body;
        const isArray = Array.isArray(body);
        const ctor = body?.constructor?.name;
        const raw = req.rawBody;
        const rawType = raw === undefined ? 'undefined' : (raw === null ? 'null' : typeof raw);
        try {
            console.log('FaceID check-out headers content-type:', ct);
            console.log('FaceID check-out body type:', bodyType, 'isArray:', isArray, 'ctor:', ctor);
            console.log('FaceID check-out body preview:', bodyType === 'string' ? body.slice(0, 200) : JSON.stringify(body)?.slice(0, 500));
            console.log('FaceID check-out rawBody type:', rawType, 'preview:', rawType === 'string' ? String(raw).slice(0, 200) : rawType === 'object' ? JSON.stringify(raw)?.slice(0, 200) : rawType);
            const isMultipart = ct && String(ct).includes('multipart/form-data');
            if (isMultipart) {
                const fieldKeys = body && typeof body === 'object' ? Object.keys(body) : [];
                console.log('FaceID check-out multipart fields:', fieldKeys);
                for (const key of fieldKeys) {
                    const val = body[key];
                    const valType = val === null ? 'null' : typeof val;
                    const looksLikeXml = valType === 'string' && /^\s*</.test(val);
                    if (looksLikeXml) {
                        const parsed = this.tryParseXml(val);
                        console.log(`Field ${key} appears XML. Parsed JSON preview:`, JSON.stringify(parsed).slice(0, 800));
                    }
                    else {
                        console.log(`Field ${key} (${valType}) preview:`, valType === 'string' ? String(val).slice(0, 200) : JSON.stringify(val)?.slice(0, 200));
                    }
                }
                const f = Array.isArray(files) ? files : [];
                console.log('FaceID check-out files count:', f.length);
                for (const file of f) {
                    const name = file.originalname;
                    const mime = file.mimetype;
                    console.log('File:', { name, mime, size: file.size });
                    const isXml = (mime && (mime.includes('xml') || mime === 'text/plain')) || (name && name.toLowerCase().endsWith('.xml'));
                    if (isXml) {
                        try {
                            const xmlText = file.buffer?.toString('utf8') ?? (file.path ? fs.readFileSync(file.path, 'utf8') : undefined);
                            const parsed = this.tryParseXml(xmlText);
                            console.log('XML file parsed to JSON preview:', JSON.stringify(parsed).slice(0, 1200));
                        }
                        catch (e) {
                            console.log('Failed to parse XML file:', e);
                        }
                    }
                }
                try {
                    const rawEventLog = body?.event_log;
                    let parsedEvent = null;
                    if (typeof rawEventLog === 'string') {
                        try {
                            parsedEvent = JSON.parse(rawEventLog);
                        }
                        catch { }
                    }
                    else if (typeof rawEventLog === 'object' && rawEventLog) {
                        parsedEvent = rawEventLog;
                    }
                    const imageFile = f.find(file => (file.mimetype || '').startsWith('image/'));
                    let imgSrc = '';
                    if (imageFile) {
                        try {
                            const mime = imageFile.mimetype || 'image/jpeg';
                            const b64 = imageFile.buffer ? imageFile.buffer.toString('base64') : (imageFile.path ? fs.readFileSync(imageFile.path).toString('base64') : '');
                            if (b64)
                                imgSrc = `data:${mime};base64,${b64}`;
                        }
                        catch { }
                    }
                    const html = `<!doctype html>
          <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>FaceID Check-Out Preview</title>
            <style>
              body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; margin:16px;}
              .wrap{max-width:900px;margin:0 auto}
              pre{background:#0f172a; color:#e2e8f0; padding:12px; border-radius:8px; overflow:auto}
              .img{margin-top:16px}
              img{max-width:100%;height:auto;border-radius:8px;border:1px solid #e5e7eb}
              .meta{color:#334155;margin-bottom:8px}
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="meta">content-type: ${String(ct)}</div>
              <h2>FaceID Check-Out</h2>
              <h3>event_log</h3>
              <pre>${parsedEvent ? JSON.stringify(parsedEvent, null, 2) : (typeof rawEventLog === 'string' ? rawEventLog.replace(/</g, '&lt;') : 'No event_log')}</pre>
              ${imgSrc ? `<div class=\"img\"><h3>Picture</h3><img src=\"${imgSrc}\" alt=\"Picture\"/></div>` : ''}
            </div>
          </body>
          </html>`;
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    return res.status(200).send(html);
                }
                catch (e) {
                    console.log('HTML preview build error (checkout):', e);
                }
            }
        }
        catch (e) {
            console.log('FaceID check-out log error:', e);
        }
        const b = body || {};
        return this.attendanceService.checkOut({
            userId: b.userId,
            faceTemplateId: b.faceTemplateId,
            branchId: b.branchId,
            deviceId: b.deviceId,
            similarity: b.similarity,
            payload: b.payload,
        });
    }
    tryParseXml(xmlText) {
        if (!xmlText || typeof xmlText !== 'string')
            return { kind: 'xml', raw: xmlText };
        try {
            const fxp = require('fast-xml-parser');
            const parser = new fxp.XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
            return { kind: 'xml-json', parsed: parser.parse(xmlText) };
        }
        catch {
            return { kind: 'xml-raw', raw: xmlText.slice(0, 5000) };
        }
    }
    createManual(body) {
        return this.attendanceService.createManual(body);
    }
    findAll(query) {
        return this.attendanceService.findAll(query);
    }
    getLast() {
        return {
            updatedAt: this.lastUpdatedAt,
            event: this.lastEventPayload,
            imageDataUrl: this.lastImageDataUrl,
        };
    }
    findOne(id) {
        return this.attendanceService.findOne(+id);
    }
    update(id, body) {
        return this.attendanceService.update(+id, body);
    }
    remove(id) {
        return this.attendanceService.remove(+id);
    }
    registerFace(body) {
        return this.attendanceService.registerFace(body);
    }
    listFaces(query) {
        return this.attendanceService.listFaces(query);
    }
    deleteFace(id) {
        return this.attendanceService.deleteFace(+id);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createManual", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('last'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getLast", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('register-face'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "registerFace", null);
__decorate([
    (0, common_1.Get)('faces'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "listFaces", null);
__decorate([
    (0, common_1.Delete)('faces/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "deleteFace", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map