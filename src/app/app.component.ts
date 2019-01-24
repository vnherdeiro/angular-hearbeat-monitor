import { Component, ViewChild, ElementRef } from '@angular/core';

import { Subscription, fromEvent, Observable } from 'rxjs';
import { filter, map, pairwise, scan, bufferCount, share } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'hearbeat-monitor';
	delays$:Observable<number>;
	heartrate$:Observable<number>;
	moving_avg$:Observable<number>;
	// max$:Observable<number>;
	// min$:Observable<number>;
	avg_window = 10;
	avg_exp_decay = 3.;
	weights:number[] = [];
	@ViewChild('video') video_ref:ElementRef;

	//coefficient for a sigmoid mapping x -> a + b/(1+exp(x/100)) of the heartrate to a playback speed
	a = 2.1766
	b = -3.7245

	constructor(){
		for( let i = -this.avg_window+1; i <= 0; i++){
			this.weights.push( Math.exp(i/this.avg_exp_decay));
		}
		this.weights.reverse();
	}

	ngOnInit() {

		this.delays$ = fromEvent(document, 'keypress')
		.pipe(
			filter( x => x['code'] === 'Space'), //collects spacebar keydowns
			map( x => Date.now()), //maps keystrokes to the event time
			pairwise(), //groups them by following pairs
			map( x => (x[1]-x[0])/1000), //computes time gaps in seconds
			);
		this.heartrate$ = this.delays$.pipe(
			map( x => 60. / +x)
			);
		this.moving_avg$ = this.heartrate$.pipe(
			bufferCount( this.avg_window, 1), //stores the previous avg_window values with forward steps of 1
			map( x => this.weightedAvg(x, this.weights)),
			share()
			);
		this.moving_avg$.subscribe( val => this.setVideoPlaybackRate( val));
		// this.max$ = this.moving_avg$.pipe( scan( Math.max, 0));
		// this.min$ = this.moving_avg$.pipe( scan( Math.min, 666));
	}

	weightedAvg( arr:number[], weights:number[]){
		arr.reverse();
		let sum_values:number = 0;
		let sum_weights:number = 0;
		for( let index in arr){
			sum_values += arr[index]*weights[index];
			sum_weights += weights[index]
		}
		let ret = sum_values/sum_weights;
		return ret;
	}

	setVideoPlaybackRate( heartrate:number){
		if( this.video_ref) {
			this.video_ref.nativeElement.playbackRate = this.heartrate2playback( heartrate);
		}
	}

	heartrate2playback( heartrate:number){
		return this.a + this.b/( 1+Math.exp(heartrate/100))
	}

}
