import { Injectable, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { environment } from '../../../../../environments/environment';
import { ValidationService, DocumentService, LocalizationService } from '../../../../core/services';
import { BytesPipe } from '../../../index';
import { FileItem } from '../model/file-item.model';

@Injectable()
export class FileUploadService implements OnDestroy {

    private fileSizeValidator = ValidationService.fileSize(environment.files.allowedFileSize);
    private fileExtensionValidator = ValidationService.extensions(environment.files.allowedFileExtensions);
    private maxFileCount = environment.files.maxFileCount;

    private _errorMessage: string;
    private _notUploadedMessage: string;
    private _hasErrors: boolean = false;
    private _files$: BehaviorSubject<FileItem[]>;

    private dataStore: {
        files: FileItem[];
        invalidFileNames: string[];
    };

    public acceptedFiles = environment.files.allowedFileExtensions;

    public ownerId: number;

    constructor(private _documentService: DocumentService, private localization: LocalizationService, private bytesPipe: BytesPipe) {
        this.dataStore = {
            files: [],
            invalidFileNames: []
        };
        this._files$ = new BehaviorSubject<FileItem[]>([]);
    }

    public get isUploaded() {
        let result = true;

        this.dataStore.files.forEach(f => {
            result = result && f.isUploaded;
        });

        return result;
    }

    public get isValid() {
        return this.isUploaded && this.dataStore.files.length > 0;
    }

    public get files$() {
        return this._files$.asObservable();
    }

    public get documentService() {
        return this._documentService;
    }

    public get errorMessage() {
        return this._errorMessage;
    }

    public get notUploadedMessage() {
        return this._notUploadedMessage;
    }

    public get hasErrors() {
        return this._hasErrors;
    }

    public add(file: File, autoUpload = true) {

        if (this.ownerId === null || this.ownerId === undefined) {
            throw new Error('ownerId is missing');
        }

        if (this.isFileValid(file) === false) {
            this.dataStore.invalidFileNames.push(file.name);
            this._hasErrors = true;
            return;
        }

        let fileItem = new FileItem(file, this);

        this.dataStore.files.push(fileItem);
        this._files$.next(this.dataStore.files);

        if (autoUpload) {
            fileItem.upload();
        }
    }

    public addInfo(files: NX1.Model.DocumentInfo[], allowDelete = false) {

        for (let i = 0; i < files.length; i++) {
            let fileItem = new FileItem(files[i], this, allowDelete);
            this.dataStore.files.push(fileItem);
        }

        this._files$.next(this.dataStore.files);
    }

    public remove(item: FileItem) {
        this.dataStore.files = this.dataStore.files.filter(f => f !== item);
        this._files$.next(this.dataStore.files);
    }

    public deleteAll() {
        this.dataStore.files.forEach(f => {
            f.remove();
        });
    }

    public ngOnDestroy() {
        if (this.dataStore && this.dataStore.files && this.dataStore.files.length) {
            this.dataStore.files.forEach(f => f.onDestroy());
        }
    }

    public get documentIds(): number[] {
        return this.dataStore.files.map(f => f.infoObject.Id);
    }

    public get documentInfos(): NX1.Model.DocumentInfo[] {
        return this.dataStore.files.map(f => f.infoObject);
    }

    private isFileValid(file: File): boolean {
        let result = true;
        let error: any;

        if ((error = this.fileExtensionValidator(file)) && error != null) {
            result = false;

            let extensions = this.dataStore.invalidFileNames.map(f => this.documentService.getFileExtension(f));
            extensions.push(error.extensions.actualExtension);
            extensions = Array.from(new Set(extensions));

            this._errorMessage = this.localization.instant('str_FileUpload_invalid_extension_{{extensions}}', {
                extensions: extensions.join(', ')
            });
        } else if ((error = this.fileSizeValidator(file)) && error != null) {
            this._errorMessage = this.localization.instant('str_FileUpload_invalid_size_{{actual_size}}_{{expected_size}}', {
                actual_size: this.bytesPipe.transform(file.size),
                expected_size: this.bytesPipe.transform(error.fileSize.requiredSize)
            });
            result = false;
        } else if (this.dataStore.files.length > this.maxFileCount) {
            this._errorMessage = this.localization.instant('str_FileUpload_invalid_files_count_{{actual_count}}_{{expected_count}}', {
                actual_count: this.dataStore.files.length + this.dataStore.invalidFileNames.length + 1,
                expected_count: this.maxFileCount
            });
            result = false;
        }


        if (result === false) {
            let fileNames = this.dataStore.invalidFileNames.concat(file.name);
            fileNames = Array.from(new Set(fileNames));
            this._notUploadedMessage = this.localization.instant('str_FileUpload_not_uploaded_files_{{file_names}}', {
                file_names: fileNames.join(', ')
            });
        }

        return result;
    }
}
