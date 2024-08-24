import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { Card } from 'src/app/core/models/card.model';
import { MoreActionService } from 'src/app/shared/services/utils/more-actions.service';
import { CardKey } from 'src/app/shared/variables/enum';
import { AppState } from 'src/app/state/app.state';
import { loadCards, loadDailyCards } from 'src/app/state/leitner-box/leitner-box.actions';
import { LoadCardsStatus } from 'src/app/state/leitner-box/leitner-box.reducer';
import {
  selectAllCards,
  selectDailyCards,
  selectStatus,
} from 'src/app/state/leitner-box/leitner-box.selectors';
import { CardsService } from '../services/cards.service';
import { CardAdapterUtils } from 'src/app/utils/card-adapter/card-adapter.utils';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private state: Store<AppState>,
    private moreActionService: MoreActionService,
    private cardService: CardsService,
  ) {}

  ngOnInit(): void {
    this.state.dispatch(loadCards());
    this.state.dispatch(loadDailyCards());
  }

  readonly destroy$ = new Subject<boolean>();

  readonly laodCardStatus = LoadCardsStatus;

  readonly getListStatus$ = this.state.select(selectStatus);

  readonly allCards$: Observable<Card[]> = this.state.select(selectAllCards);

  readonly dailyCards$: Observable<Card[]> = this.state.select(selectDailyCards);

  readonly distinctCardsTag$: Observable<string[]> = this.allCards$.pipe(
    map((cards) => CardAdapterUtils.getDistinctValuesFromCardArray(cards, CardKey.Tag)),
  );

  readonly cardsByTag$: Observable<Map<string, Card[]>> = combineLatest([
    this.distinctCardsTag$,
    this.dailyCards$,
  ]).pipe(
    map(([distinctCardsTag, allCards]) =>
      CardAdapterUtils.getCardsByTagsMap(distinctCardsTag, allCards),
    ),
  );

  handleClickAddList(): void {
    let availableTags: string[] = [];
    this.distinctCardsTag$.pipe(takeUntil(this.destroy$)).subscribe((tags) => {
      availableTags = tags;
    });
    this.moreActionService.openAddCardDialog$(null, availableTags);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
