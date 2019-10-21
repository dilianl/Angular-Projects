import { Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, Component } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { BytesPipe } from '../../index';

import { FileItem } from './model/file-item.model';
import { FileUploadService } from './services/file-upload.service';
import { SidePanelRef } from '../side-panel/';

@Component({
    selector: 'nx1-file-upload',
    templateUrl: 'file-upload.component.html',
    styleUrls: ['file-upload.component.scss'],
    providers: [FileUploadService, BytesPipe],
    changeDetection: ChangeDetectionStrategy.Default
})
export class FileUploadComponent implements OnInit, OnDestroy {

    private sub: Subscription;

    /**
     * The identifier of the owner of the uploaded documents.
     */
    @Input()
    public ownerId: number;

    @Input()
    public returnType: 'Id' | 'Info' = 'Id';

    /**
     * Emitted when uploaded documents are saved.
     * Returns the identifiers of the uploaded documents.
     */
    @Output()
    public save = new EventEmitter<number[] | NX1.Model.DocumentInfo[]>();

    protected files$: Observable<FileItem[]>;
    private isSaved: boolean;

    constructor(private fileUploadService: FileUploadService, private sidePanelRef: SidePanelRef<FileUploadComponent>) {
    }

    ngOnInit() {
        this.files$ = this.fileUploadService.files$;
        this.fileUploadService.ownerId = this.ownerId;
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }

        if (!this.isSaved) {
            this.fileUploadService.deleteAll();
        }
    }

    protected onFileSelect(files: FileList | File) {

        if (files instanceof FileList) {
            for (let i = 0; i < files.length; i++) {
                this.fileUploadService.add(files[i]);
            }
        } else if (files instanceof File) {
            this.fileUploadService.add(files);
        }
    }

    protected onSave() {

        if (this.fileUploadService.isUploaded) {
            if (this.returnType === 'Id') {
                this.save.emit(this.fileUploadService.documentIds);
            } else {
                this.save.emit(this.fileUploadService.documentInfos);
            }
            this.isSaved = true;
            this.onClose();
        }
    }

    protected onClose() {
        this.sidePanelRef.close();
    }
}
