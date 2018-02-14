
import {
	Component,
	ViewChild,
	HostBinding,
	HostListener,
	Input,
	ElementRef,
	Inject,
	forwardRef,
	Renderer2,
	ChangeDetectionStrategy
} from '@angular/core';

import {
	IListChild,
	IgxListPanState
} from "./list.common"

import { HammerGesturesManager } from "../core/touch";
import { IgxRippleModule } from "../directives/ripple/ripple.directive";

import { IgxListComponent } from "./list.component"

// ====================== ITEM ================================
// The `<igx-item>` component is a container intended for row items in
// a `<igx-list>` container.
@Component({
	providers: [HammerGesturesManager],
	selector: "igx-list-item",
	templateUrl: "list-item.component.html",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class IgxListItemComponent implements IListChild {
	private _panState: IgxListPanState = IgxListPanState.NONE;
	private _FRACTION_OF_WIDTH_TO_TRIGGER_GRIP = 0.5; // as a fraction of the item width
	private _innerStyle: string = "";
	private _currentLeft = 0;

	@HostBinding("attr.role") public get role() {
		return this.isHeader ? "separator" : "listitem";
	}

	@Input() public isHeader: boolean;
	@Input() public href: string;

	@HostBinding("hidden") @Input() public hidden : boolean;
	@HostBinding("attr.aria-label") public ariaLabel : string;

	constructor(
		@Inject(forwardRef(() => IgxListComponent))
		public list: IgxListComponent,
		private elementRef: ElementRef,
		private _renderer: Renderer2) {
	}

	public get element() {
		return this.elementRef.nativeElement;
	}

	@HostBinding("style.touch-action") touchAction = "pan-y";

	@HostBinding("class.igx-list__header")
	get headerStyle(): boolean {
		return this.isHeader;
	}
	@HostBinding("class.igx-list__item")
	get innerStyle(): boolean {
		return !this.isHeader;
	}

	public get panState(): IgxListPanState {
		return this._panState;
	}

	public get index(): number {
		return this.list.children.toArray().indexOf(this);
	}

	public get width() {
		if (this.element) {
			return this.element.offsetWidth;
		} else {
			return 0;
		}
	}

	private get left() {
		return this.element.offsetLeft;
	}
	private set left(value: number) {
		let val = value + "";

		if (val.indexOf("px") === -1) {
			val += "px";
		}
		this.element.style.left = val;
	}

	public get maxLeft() {
		return -this.width;
	}

	public get maxRight() {
		return this.width;
	}

	@HostListener("click", ['$event']) clicked(evt) {
		this.list.onItemClicked.emit({item: this, event: evt});
	}

	@HostListener("panstart", ['$event']) panStart(ev: HammerInput) {
		if(!this.isTrue(this.list.allowLeftPanning) && !this.isTrue(this.list.allowRightPanning))
			return;

		this._currentLeft = this.left;
	}

	@HostListener("panmove", ['$event']) panMove(ev: HammerInput) {
		if(!this.isTrue(this.list.allowLeftPanning) && !this.isTrue(this.list.allowRightPanning))
			return;

		const isPanningToLeft = ev.deltaX < 0;
		this.left = this._currentLeft + ev.deltaX;
		if (isPanningToLeft) {
			if (this.isTrue(this.list.allowRightPanning) && !this.isTrue(this.list.allowLeftPanning) && this.left < 0) {
				this.left = 0;
			} else if (this.left < this.maxLeft) {
				this.left = this.maxLeft;
			}
		} else if (!isPanningToLeft) {
			if (this.isTrue(this.list.allowLeftPanning) && !this.isTrue(this.list.allowRightPanning) && this.left > 0) {
				this.left = 0;
			} else if (this.left > this.maxRight) {
				this.left = this.maxRight;
			}
		}
	}

	@HostListener("panend", ['$event']) panEnd(ev: HammerInput) {
		if(!this.isTrue(this.list.allowLeftPanning) && !this.isTrue(this.list.allowRightPanning))
			return;

		const oldPanState = this._panState;

		this.performMagneticGrip();

		if (oldPanState !== this._panState) {
			this.list.onPanStateChange.emit({ oldState: oldPanState, newState: this._panState, item: this });
			if (this._panState === IgxListPanState.LEFT) {
				this.list.onLeftPan.emit(this);
			} else if (this._panState === IgxListPanState.RIGHT) {
				this.list.onRightPan.emit(this);
			}
		}
	}

	private performMagneticGrip() {
		const widthTriggeringGrip = this.width * this._FRACTION_OF_WIDTH_TO_TRIGGER_GRIP;

		if (this.left > 0) {
			if (this.left > widthTriggeringGrip) {
				this.left = this.maxRight;
				this._panState = IgxListPanState.RIGHT;
			} else {
				this.left = 0;
				this._panState = IgxListPanState.NONE;
			}
		} else {
			if (-this.left > widthTriggeringGrip) {
				this.left = this.maxLeft;
				this._panState = IgxListPanState.LEFT;
			} else {
				this.left = 0;
				this._panState = IgxListPanState.NONE;
			}
		}
	}

	private isTrue(value: boolean) : boolean {
		if(typeof(value) === "boolean") {
			return value;
		} else {
			return value === "true";
		}
	}
}