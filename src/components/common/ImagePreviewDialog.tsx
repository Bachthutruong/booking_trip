'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { Document, Page, pdfjs } from 'react-pdf';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface ImagePreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    imageUrl: string;
}

export default function ImagePreviewDialog({ isOpen, onOpenChange, imageUrl }: ImagePreviewDialogProps) {
    const isPdf = imageUrl.toLowerCase().endsWith('.pdf');
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfLoading, setPdfLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setPdfLoading(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>付款證明檔案</DialogTitle>
                    <DialogDescription>
                        {isPdf ? '预览PDF文档。' : '預覽照片'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center items-center bg-muted p-2 rounded-md min-h-[300px]">
                    {isPdf ? (
                        <div className="w-full flex flex-col items-center">
                            {pdfLoading && (
                                <div className="flex flex-col items-center justify-center h-[300px]">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground mt-2">加载PDF...</p>
                                </div>
                            )}
                            <Document
                                file={imageUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={console.error}
                                className="w-full"
                            >
                                <Page pageNumber={pageNumber} width={750} />
                            </Document>
                            {numPages && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    第 {pageNumber} 页，共 {numPages} 页
                                </p>
                            )}
                            {numPages && numPages > 1 && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="button"
                                        disabled={pageNumber <= 1}
                                        onClick={() => setPageNumber(prevPageNumber => prevPageNumber - 1)}
                                        className="px-3 py-1 bg-gray-200 rounded-md text-sm"
                                    >
                                        上一页
                                    </button>
                                    <button
                                        type="button"
                                        disabled={pageNumber >= numPages}
                                        onClick={() => setPageNumber(prevPageNumber => prevPageNumber + 1)}
                                        className="px-3 py-1 bg-gray-200 rounded-md text-sm"
                                    >
                                        下一页
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Image
                            src={imageUrl}
                            alt="Payment Proof"
                            width={700}
                            height={500}
                            className="object-contain max-h-[70vh] rounded-md"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
} 