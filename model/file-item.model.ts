import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { FileUploadService } from '../services/file-upload.service';

export class FileItem {

    private _isUploaded: boolean;
    private sub: Subscription[];
    private file: File;

    public infoObject: NX1.Model.DocumentInfo;

    public loadingMode: 'determinate' | 'query' | 'indeterminate' = 'query';
    public progress$: Observable<number>;

    constructor(documentInfo: NX1.Model.DocumentInfo, fileUpload: FileUploadService, allowDelete: boolean);
    constructor(file: File, fileUpload: FileUploadService);
    constructor(fileOrDocument: File | NX1.Model.DocumentInfo, private fileUpload: FileUploadService, private allowDelete: boolean = true) {
        this.sub = [];
        
        if (fileOrDocument instanceof File) {
            this.file = fileOrDocument;
            this.infoObject = {
                Name: fileOrDocument.name,
                DocumentCloudName: this.fileUpload.documentService.getCloudDocumentFileName(fileOrDocument.name),
                CloudId: this.fileUpload.documentService.cloudId,
                OwnerId: this.fileUpload.ownerId,
                MimeType: fileOrDocument.type,
                Extension: this.fileUpload.documentService.getFileExtension(fileOrDocument.name),
                Description: '',
                Size: fileOrDocument.size,
                IsFolder: false,
                IsPreviousVersion: false,
                IsShared: false,
                IsHidden: false
            };
        }
        else // if (file instanceof NX1.Model.DocumentInfo)
        {
            this._isUploaded = true;
            //this.progress$ = Observable.of(100);
            this.infoObject = fileOrDocument;
        }
    }

    get isUploaded(): boolean {
        return this._isUploaded;
    }

    public get name(): string {
        if (this.file) {
            return this.file.name;
        }
        else {
            return this.infoObject.Name;
        }

    }

    public get size(): number {
        if (this.file) {
            return this.file.size;
        }
        else {
            return this.infoObject.Size;
        }
    }

    public remove() {
        if (this.infoObject.Id) {
            this.loadingMode = 'indeterminate';
            if (this.allowDelete) {
                this.sub.push(this.fileUpload.documentService.deleteDocument(this.infoObject.Id).subscribe(val => {
                }));
            }
        }

        this.onDestroy();
        this.fileUpload.remove(this);
    }

    public upload() {
        const sub = this.fileUpload.documentService.getSignedUrl(this.infoObject.DocumentCloudName)
            .flatMap((signedUrl: NX1.Model.SignedUrl) => {
                this.infoObject.Container = signedUrl.Container;
                this.loadingMode = 'determinate';
                let upload = this.fileUpload.documentService.uploadFileToCloud(signedUrl, this.file);
                this.progress$ = upload.progress;
                return upload.upload;
            })
            .flatMap((req) => {
                return this.fileUpload.documentService.createDocument(this.infoObject);
            }).do(doc => {
                this._isUploaded = true;
                this.infoObject = doc;
                return doc;
            }).subscribe();

        this.sub.push(sub);
    }

    public onDestroy() {
        if (this.sub && this.sub.length > 0) {
            this.sub.forEach(sub => sub.unsubscribe());
        }
    }
}
