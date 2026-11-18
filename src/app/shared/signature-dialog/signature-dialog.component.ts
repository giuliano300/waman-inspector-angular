import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
@Component({selector:'app-signature-dialog',standalone:true,templateUrl:'./signature-dialog.component.html',styleUrl:'./signature-dialog.component.scss'})
export class SignatureDialogComponent implements AfterViewChecked{
 @Input() open=false; @Input() title='Add signature'; @Input() eyebrow='Confirmation'; @Output() closed=new EventEmitter<void>(); @Output() confirmed=new EventEmitter<string>(); @ViewChild('canvas') canvas?:ElementRef<HTMLCanvasElement>;
 hasInk=false; private drawing=false; private context?:CanvasRenderingContext2D|null; private prepared=false;
 ngAfterViewChecked():void{if(this.open&&!this.prepared){document.body.classList.add('no-scroll');this.prepare();this.prepared=true}if(!this.open){document.body.classList.remove('no-scroll');this.prepared=false}}
 private prepare():void{const c=this.canvas?.nativeElement;if(!c)return;this.hasInk=false;const ratio=window.devicePixelRatio||1,rect=c.getBoundingClientRect();c.width=rect.width*ratio;c.height=rect.height*ratio;this.context=c.getContext('2d');this.context?.scale(ratio,ratio);if(this.context){this.context.lineWidth=2.4;this.context.lineCap='round';this.context.lineJoin='round';this.context.strokeStyle='#182631'}}
 start(e:PointerEvent):void{if(!this.context||!this.canvas)return;const r=this.canvas.nativeElement.getBoundingClientRect();this.drawing=true;this.canvas.nativeElement.setPointerCapture(e.pointerId);this.context.beginPath();this.context.moveTo(e.clientX-r.left,e.clientY-r.top)}
 draw(e:PointerEvent):void{if(!this.drawing||!this.context||!this.canvas)return;const r=this.canvas.nativeElement.getBoundingClientRect();this.context.lineTo(e.clientX-r.left,e.clientY-r.top);this.context.stroke();this.hasInk=true}
 stop():void{this.drawing=false;this.context?.closePath()} clear():void{const c=this.canvas?.nativeElement;if(c&&this.context){this.context.clearRect(0,0,c.width,c.height);this.hasInk=false}}
 close():void{document.body.classList.remove('no-scroll');this.closed.emit()}
 confirm():void{if(!this.hasInk)return;document.body.classList.remove('no-scroll');this.confirmed.emit(this.canvas?.nativeElement.toDataURL('image/png')??'')}
}
