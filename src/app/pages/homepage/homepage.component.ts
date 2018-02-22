import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent {
  accessForm: FormGroup;
  submitted: boolean;

  constructor(
    private fb: FormBuilder,
    private router: Router) {
    this.createForm();
    this.submitted = false;
  }

  createForm() {
    this.accessForm = this.fb.group({
      topic: ['', Validators.required],
      nickname: ['', Validators.required]
    });
  }

  submit() {
    this.submitted = true;
    if (this.accessForm.valid){
      this.router.navigate(["/room", this.accessForm.value.topic]);
    } else{
    }
  }
}
