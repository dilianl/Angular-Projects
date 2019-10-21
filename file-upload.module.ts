import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared.module';
import { FileUploadComponent } from './file-upload.component';

@NgModule({
        imports: [SharedModule],
        declarations: [FileUploadComponent],
        providers: [],
        exports: [FileUploadComponent],
        entryComponents: [FileUploadComponent]
    })
export class FileUploadModule {
}
